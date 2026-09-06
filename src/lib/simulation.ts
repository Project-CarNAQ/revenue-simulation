import { createPRNG, SeededPRNG } from "./prng";
import {
  VehicleCategory,
  TripCategory,
  SimulationConfig,
  Trip,
} from "./types";
import { roundCurrency, roundMetric } from "./currency";
import { getAreasForCity } from "./cities";

export interface VehicleContext {
  id: string;
  category: VehicleCategory;
  city: string;
  registered_date: string; // YYYY-MM-DD
}

/**
 * Calculates day_index: days elapsed between registered_date and targetDate.
 */
export function calculateDayIndex(registeredDateStr: string, targetDateStr: string): number {
  const regDate = new Date(`${registeredDateStr}T00:00:00Z`);
  const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
  const diffTime = targetDate.getTime() - regDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns date string YYYY-MM-DD for a given registered_date and day_index.
 */
export function getDateFromDayIndex(registeredDateStr: string, dayIndex: number): string {
  const regDate = new Date(`${registeredDateStr}T00:00:00Z`);
  regDate.setUTCDate(regDate.getUTCDate() + dayIndex);
  return regDate.toISOString().slice(0, 10);
}

/**
 * Resolves fuel efficiency (km / liter) for a specific vehicle category.
 */
export function getFuelEfficiency(
  config: SimulationConfig,
  category: VehicleCategory
): number {
  if (typeof config.fuel_efficiency_km_per_liter === "number") {
    return config.fuel_efficiency_km_per_liter;
  }
  const eff = config.fuel_efficiency_km_per_liter?.[category];
  if (typeof eff === "number" && eff > 0) {
    return eff;
  }
  // Default fallbacks
  switch (category) {
    case "hatchback":
      return 15;
    case "sedan":
      return 12;
    case "suv":
      return 9;
    default:
      return 12;
  }
}

/**
 * Generates deterministic trips for a vehicle on a specific day_index.
 */
export function generateTripsForDay(
  vehicle: VehicleContext,
  config: SimulationConfig,
  dayIndex: number
): Trip[] {
  // If date is before vehicle registration, vehicle was not active
  if (dayIndex < 0) {
    return [];
  }

  const dateStr = getDateFromDayIndex(vehicle.registered_date, dayIndex);
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Day-level PRNG for trip count
  const dayPrng = createPRNG(vehicle.id, dayIndex, 0, "day_meta");

  const [minTrips, maxTrips] = config.trip_count_range_per_day || [3, 6];
  let tripCount = dayPrng.int(minTrips, maxTrips);

  // Category weight adjustments based on vehicle class and weekend bias
  const baseWeights = config.category_weights || {
    ride_hailing: 0.7,
    self_drive_rental: 0.2,
    wedding_event: 0.1,
  };

  let rideHailingWeight = baseWeights.ride_hailing ?? 0.7;
  let rentalWeight = baseWeights.self_drive_rental ?? 0.2;
  let weddingWeight = baseWeights.wedding_event ?? 0.1;

  // Weekends bias toward wedding/event and self-drive rentals
  if (isWeekend) {
    weddingWeight *= 2.2;
    rentalWeight *= 1.4;
    rideHailingWeight *= 0.6;
  }

  // Vehicle class bias
  if (vehicle.category === "suv") {
    weddingWeight *= 1.8;
    rentalWeight *= 1.5;
    rideHailingWeight *= 0.7;
  } else if (vehicle.category === "hatchback") {
    weddingWeight *= 0.1; // Hatchbacks rarely booked for wedding events
    rideHailingWeight *= 1.4;
  }

  const cityAreas = getAreasForCity(vehicle.city);
  const fuelEfficiency = getFuelEfficiency(config, vehicle.category);
  const fareRatePerKm =
    config.fare_rate_per_km_by_category?.[vehicle.category] || 65;

  const trips: Trip[] = [];

  for (let i = 0; i < tripCount; i++) {
    const tripPrng = createPRNG(vehicle.id, dayIndex, i);

    // Pick trip category deterministically
    const tripCategory = tripPrng.weightedChoice<TripCategory>([
      { item: "ride_hailing", weight: rideHailingWeight },
      { item: "self_drive_rental", weight: rentalWeight },
      { item: "wedding_event", weight: weddingWeight },
    ]);

    // Deterministic timestamp (07:00 to 23:00)
    const baseHour = Math.floor(7 + (16 / Math.max(1, tripCount)) * i);
    const hourJitter = tripPrng.int(-1, 1);
    const hour = Math.min(23, Math.max(7, baseHour + hourJitter));
    const minute = tripPrng.int(0, 59);
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Deterministic routing areas
    const fromArea = tripPrng.pick(cityAreas);
    let toArea = tripPrng.pick(cityAreas);
    if (toArea === fromArea && cityAreas.length > 1) {
      const otherAreas = cityAreas.filter((a) => a !== fromArea);
      toArea = tripPrng.pick(otherAreas);
    }

    // Distance and duration
    let distanceKm = 0;
    let durationMin = 0;
    let grossFare = 0;

    // Variance factor from config range
    const [minVariance, maxVariance] = config.variance_range || [0.85, 1.15];
    const varianceFactor = tripPrng.range(minVariance, maxVariance);

    // Seasonality multiplier
    const seasonalityMultiplier =
      isWeekend && config.seasonality_multipliers?.weekend
        ? config.seasonality_multipliers.weekend
        : 1.0;

    if (tripCategory === "ride_hailing") {
      distanceKm = roundMetric(tripPrng.range(4.5, 32.0), 1);
      durationMin = Math.round(
        distanceKm * tripPrng.range(2.0, 3.2) + tripPrng.range(5, 15)
      );
      // Ride-hailing fare = distance_km × fare_rate_per_km[category] × variance_factor × seasonality
      grossFare =
        distanceKm * fareRatePerKm * varianceFactor * seasonalityMultiplier;
    } else if (tripCategory === "self_drive_rental") {
      distanceKm = roundMetric(tripPrng.range(35.0, 110.0), 1);
      durationMin = tripPrng.int(180, 480);
      const flatRanges = config.flat_fare_range_by_category?.self_drive_rental?.[
        vehicle.category
      ] || [4000, 6500];
      const flatBase = tripPrng.range(flatRanges[0], flatRanges[1]);
      grossFare = flatBase * varianceFactor * seasonalityMultiplier;
    } else {
      // wedding_event
      distanceKm = roundMetric(tripPrng.range(20.0, 75.0), 1);
      durationMin = tripPrng.int(240, 600);
      const flatRanges = config.flat_fare_range_by_category?.wedding_event?.[
        vehicle.category
      ] || [8000, 16000];
      const flatBase = tripPrng.range(flatRanges[0], flatRanges[1]);
      grossFare = flatBase * varianceFactor * seasonalityMultiplier;
    }

    // Calculations
    const roundedGrossFare = roundCurrency(grossFare);
    // Fuel cost = distance_km × (fuel_price_per_liter / fuel_efficiency_km_per_liter)
    const fuelCost = roundCurrency(
      distanceKm * (config.fuel_price_per_liter / fuelEfficiency)
    );
    // Platform fee = gross_fare × platform_fee_rate
    const platformFee = roundCurrency(
      roundedGrossFare * config.platform_fee_rate
    );
    // Net = gross_fare − fuel_cost − platform_fee
    const net = roundCurrency(roundedGrossFare - fuelCost - platformFee);

    trips.push({
      date: dateStr,
      time: timeStr,
      category: tripCategory,
      from_area: fromArea,
      to_area: toArea,
      distance_km: distanceKm,
      duration_min: durationMin,
      gross_fare: roundedGrossFare,
      fuel_cost: fuelCost,
      platform_fee: platformFee,
      net,
    });
  }

  // Sort trips chronologically by time
  trips.sort((a, b) => a.time.localeCompare(b.time));

  return trips;
}
