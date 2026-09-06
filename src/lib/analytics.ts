import {
  VehicleContext,
  calculateDayIndex,
  generateTripsForDay,
  getDateFromDayIndex,
  getFuelEfficiency,
} from "./simulation";
import {
  SimulationConfig,
  Trip,
  SummaryResponse,
  TrendPoint,
  AnomalyCheckResult,
  DistributionPreviewResult,
} from "./types";
import { roundCurrency, roundMetric } from "./currency";

/**
 * Parses and validates date string YYYY-MM-DD.
 */
export function parseDate(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  return d;
}

/**
 * Returns list of YYYY-MM-DD strings between start and end inclusive.
 */
export function getDateRangeList(startDateStr: string, endDateStr: string): string[] {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  if (start.getTime() > end.getTime()) {
    throw new Error(`Start date (${startDateStr}) cannot be after end date (${endDateStr}).`);
  }

  const dates: string[] = [];
  const current = new Date(start);

  while (current.getTime() <= end.getTime()) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Generates all deterministic trips for a vehicle across a date range.
 */
export function generateTripsForDateRange(
  vehicle: VehicleContext,
  config: SimulationConfig,
  startDateStr: string,
  endDateStr: string
): Trip[] {
  const dates = getDateRangeList(startDateStr, endDateStr);
  const allTrips: Trip[] = [];

  for (const dateStr of dates) {
    const dayIndex = calculateDayIndex(vehicle.registered_date, dateStr);
    if (dayIndex >= 0) {
      const dayTrips = generateTripsForDay(vehicle, config, dayIndex);
      allTrips.push(...dayTrips);
    }
  }

  return allTrips;
}

/**
 * Computes financial summary for a given period: "today" | "week" | "month".
 */
export function getSummaryForPeriod(
  vehicle: VehicleContext,
  config: SimulationConfig,
  period: "today" | "week" | "month",
  referenceDateStr?: string
): SummaryResponse {
  const refDate = referenceDateStr
    ? parseDate(referenceDateStr)
    : new Date();

  const endDateStr = refDate.toISOString().slice(0, 10);
  let startDateStr = endDateStr;

  if (period === "week") {
    const startD = new Date(refDate);
    startD.setUTCDate(startD.getUTCDate() - 6);
    startDateStr = startD.toISOString().slice(0, 10);
  } else if (period === "month") {
    const startD = new Date(refDate);
    startD.setUTCDate(startD.getUTCDate() - 29);
    startDateStr = startD.toISOString().slice(0, 10);
  }

  const trips = generateTripsForDateRange(vehicle, config, startDateStr, endDateStr);

  let grossRevenue = 0;
  let fuelCost = 0;
  let platformFee = 0;
  let netIncome = 0;
  let distanceKm = 0;

  for (const trip of trips) {
    grossRevenue += trip.gross_fare;
    fuelCost += trip.fuel_cost;
    platformFee += trip.platform_fee;
    netIncome += trip.net;
    distanceKm += trip.distance_km;
  }

  return {
    trip_count: trips.length,
    gross_revenue: roundCurrency(grossRevenue),
    fuel_cost: roundCurrency(fuelCost),
    platform_fee: roundCurrency(platformFee),
    net_income: roundCurrency(netIncome),
    distance_km: roundMetric(distanceKm, 1),
    period_start: startDateStr,
    period_end: endDateStr,
  };
}

/**
 * Computes daily net trend points for charting.
 */
export function getTrendForDays(
  vehicle: VehicleContext,
  config: SimulationConfig,
  days: number = 30,
  referenceDateStr?: string
): TrendPoint[] {
  const safeDays = Math.max(1, Math.min(365, days));
  const refDate = referenceDateStr
    ? parseDate(referenceDateStr)
    : new Date();

  const points: TrendPoint[] = [];

  for (let i = safeDays - 1; i >= 0; i--) {
    const target = new Date(refDate);
    target.setUTCDate(target.getUTCDate() - i);
    const dateStr = target.toISOString().slice(0, 10);
    const dayIndex = calculateDayIndex(vehicle.registered_date, dateStr);

    if (dayIndex < 0) {
      points.push({ date: dateStr, net: 0 });
    } else {
      const trips = generateTripsForDay(vehicle, config, dayIndex);
      const dayNet = trips.reduce((sum, t) => sum + t.net, 0);
      points.push({ date: dateStr, net: roundCurrency(dayNet) });
    }
  }

  return points;
}

/**
 * Rule-based anomaly check comparing reported/generated net against expected baseline.
 */
export function checkAnomalyForPeriod(
  vehicle: VehicleContext,
  config: SimulationConfig,
  periodStart: string,
  periodEnd: string
): AnomalyCheckResult {
  const trips = generateTripsForDateRange(vehicle, config, periodStart, periodEnd);
  const reportedNet = roundCurrency(trips.reduce((sum, t) => sum + t.net, 0));

  const dates = getDateRangeList(periodStart, periodEnd);
  const totalDays = dates.length;

  // Calculate theoretical expected daily benchmark for this vehicle category
  const [minTrips, maxTrips] = config.trip_count_range_per_day || [3, 6];
  const avgTripsPerDay = (minTrips + maxTrips) / 2;

  const weights = config.category_weights || {
    ride_hailing: 0.7,
    self_drive_rental: 0.2,
    wedding_event: 0.1,
  };

  const fareRate = config.fare_rate_per_km_by_category?.[vehicle.category] || 65;
  const avgRideDistance = 16;
  const expectedRideGross = avgRideDistance * fareRate;

  const rentalRange = config.flat_fare_range_by_category?.self_drive_rental?.[vehicle.category] || [4000, 6500];
  const expectedRentalGross = (rentalRange[0] + rentalRange[1]) / 2;

  const weddingRange = config.flat_fare_range_by_category?.wedding_event?.[vehicle.category] || [8000, 16000];
  const expectedWeddingGross = (weddingRange[0] + weddingRange[1]) / 2;

  const blendedGrossPerTrip =
    weights.ride_hailing * expectedRideGross +
    weights.self_drive_rental * expectedRentalGross +
    weights.wedding_event * expectedWeddingGross;

  const fuelEfficiency = getFuelEfficiency(config, vehicle.category);
  const avgDistancePerTrip =
    weights.ride_hailing * 16 +
    weights.self_drive_rental * 70 +
    weights.wedding_event * 45;

  const expectedFuelPerTrip = avgDistancePerTrip * (config.fuel_price_per_liter / fuelEfficiency);
  const expectedPlatformFeePerTrip = blendedGrossPerTrip * config.platform_fee_rate;
  const expectedNetPerTrip = blendedGrossPerTrip - expectedFuelPerTrip - expectedPlatformFeePerTrip;

  const expectedDailyNet = expectedNetPerTrip * avgTripsPerDay;
  const expectedTotalNet = expectedDailyNet * totalDays;

  const [minVar, maxVar] = config.variance_range || [0.85, 1.15];
  // Allow an extra 15% operational buffer for day-of-week clustering & routing variance
  const lowerBound = roundCurrency(expectedTotalNet * minVar * 0.75);
  const upperBound = roundCurrency(expectedTotalNet * maxVar * 1.25);

  let flagged = false;
  let severity: "low" | "medium" | "high" | null = null;
  let reason: string | null = null;

  if (reportedNet < lowerBound) {
    flagged = true;
    const deviationRatio = (lowerBound - reportedNet) / Math.max(1, lowerBound);
    if (deviationRatio > 0.35) {
      severity = "high";
    } else if (deviationRatio > 0.18) {
      severity = "medium";
    } else {
      severity = "low";
    }
    reason = `Reported net (${reportedNet}) is below expected baseline range [${lowerBound}, ${upperBound}] for ${vehicle.category} in ${vehicle.city}.`;
  } else if (reportedNet > upperBound) {
    flagged = true;
    const deviationRatio = (reportedNet - upperBound) / Math.max(1, upperBound);
    if (deviationRatio > 0.35) {
      severity = "high";
    } else if (deviationRatio > 0.18) {
      severity = "medium";
    } else {
      severity = "low";
    }
    reason = `Reported net (${reportedNet}) exceeds expected baseline range [${lowerBound}, ${upperBound}] for ${vehicle.category} in ${vehicle.city}.`;
  }

  return {
    flagged,
    severity,
    reason,
    reported_net: reportedNet,
    expected_net_range: [lowerBound, upperBound],
  };
}

/**
 * Computes pure math preview of what a revenue distribution would pay out.
 */
export function calculateDistributionPreview(
  vehicle: VehicleContext,
  config: SimulationConfig,
  periodStart: string,
  periodEnd: string
): DistributionPreviewResult {
  const trips = generateTripsForDateRange(vehicle, config, periodStart, periodEnd);

  let grossRevenue = 0;
  let operatingExpenses = 0;
  let platformFee = 0;

  for (const trip of trips) {
    grossRevenue += trip.gross_fare;
    operatingExpenses += trip.fuel_cost;
    platformFee += trip.platform_fee;
  }

  const roundedGross = roundCurrency(grossRevenue);
  const roundedExpenses = roundCurrency(operatingExpenses);
  const roundedFee = roundCurrency(platformFee);
  const netDistributable = roundCurrency(roundedGross - roundedExpenses - roundedFee);

  return {
    gross_revenue: roundedGross,
    operating_expenses: roundedExpenses,
    platform_fee: roundedFee,
    net_distributable: netDistributable,
  };
}
