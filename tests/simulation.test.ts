import { describe, it, expect } from "vitest";
import {
  generateTripsForDay,
  calculateDayIndex,
  getDateFromDayIndex,
  VehicleContext,
} from "../src/lib/simulation";
import { SimulationConfig } from "../src/lib/types";
import defaultsConfig from "../config/defaults.json";

const mockConfig: SimulationConfig = defaultsConfig as SimulationConfig;

describe("Deterministic Simulation Engine", () => {
  const vehicle: VehicleContext = {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    category: "sedan",
    city: "Lahore",
    registered_date: "2025-01-15",
  };

  it("calculates day_index correctly", () => {
    expect(calculateDayIndex("2025-01-15", "2025-01-15")).toBe(0);
    expect(calculateDayIndex("2025-01-15", "2025-01-16")).toBe(1);
    expect(calculateDayIndex("2025-01-15", "2025-01-25")).toBe(10);
    expect(calculateDayIndex("2025-01-15", "2025-01-10")).toBe(-5);
  });

  it("converts day_index back to date string", () => {
    expect(getDateFromDayIndex("2025-01-15", 0)).toBe("2025-01-15");
    expect(getDateFromDayIndex("2025-01-15", 1)).toBe("2025-01-16");
    expect(getDateFromDayIndex("2025-01-15", 10)).toBe("2025-01-25");
  });

  it("generates 100% reproducible trips on consecutive runs", () => {
    const run1 = generateTripsForDay(vehicle, mockConfig, 5);
    const run2 = generateTripsForDay(vehicle, mockConfig, 5);

    expect(run1).toEqual(run2);
    expect(run1.length).toBeGreaterThanOrEqual(3);
    expect(run1.length).toBeLessThanOrEqual(6);
  });

  it("ensures net = gross_fare - fuel_cost - platform_fee and all numbers are rounded", () => {
    const trips = generateTripsForDay(vehicle, mockConfig, 12);

    for (const trip of trips) {
      expect(trip.gross_fare).toBeGreaterThan(0);
      expect(trip.fuel_cost).toBeGreaterThan(0);
      expect(trip.platform_fee).toBeGreaterThan(0);

      // Verify net formula
      const expectedNet = Math.round((trip.gross_fare - trip.fuel_cost - trip.platform_fee) * 100) / 100;
      expect(trip.net).toBe(expectedNet);

      // Verify no floating point decimals beyond 2 places
      const checkDecimal = (n: number) => {
        const parts = n.toString().split(".");
        if (parts.length > 1) {
          expect(parts[1].length).toBeLessThanOrEqual(2);
        }
      };

      checkDecimal(trip.gross_fare);
      checkDecimal(trip.fuel_cost);
      checkDecimal(trip.platform_fee);
      checkDecimal(trip.net);

      // Verify valid areas
      expect(trip.from_area).toBeTruthy();
      expect(trip.to_area).toBeTruthy();
      expect(trip.from_area).not.toBe(trip.to_area);
    }
  });

  it("returns empty array for negative day_index (before registration)", () => {
    const trips = generateTripsForDay(vehicle, mockConfig, -1);
    expect(trips).toEqual([]);
  });

  it("shows weekend bias toward wedding and rental categories", () => {
    // 2025-01-18 is Saturday (day 3), 2025-01-15 is Wednesday (day 0)
    const suvVehicle: VehicleContext = {
      id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      category: "suv",
      city: "Lahore",
      registered_date: "2025-01-15",
    };

    let weekendSpecialCount = 0;
    let weekdaySpecialCount = 0;

    // Sample across 20 weekends vs 20 weekdays
    for (let w = 0; w < 20; w++) {
      // day 3 + w*7 is Saturday
      const satTrips = generateTripsForDay(suvVehicle, mockConfig, 3 + w * 7);
      weekendSpecialCount += satTrips.filter((t) => t.category !== "ride_hailing").length;

      // day 0 + w*7 is Wednesday
      const wedTrips = generateTripsForDay(suvVehicle, mockConfig, 0 + w * 7);
      weekdaySpecialCount += wedTrips.filter((t) => t.category !== "ride_hailing").length;
    }

    expect(weekendSpecialCount).toBeGreaterThan(weekdaySpecialCount);
  });
});
