import { describe, it, expect } from "vitest";
import {
  generateTripsForDateRange,
  getSummaryForPeriod,
  getTrendForDays,
  checkAnomalyForPeriod,
  calculateDistributionPreview,
} from "../src/lib/analytics";
import { VehicleContext } from "../src/lib/simulation";
import { SimulationConfig } from "../src/lib/types";
import defaultsConfig from "../config/defaults.json";

const mockConfig: SimulationConfig = defaultsConfig as SimulationConfig;

describe("Analytics & Aggregation Engine", () => {
  const vehicle: VehicleContext = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    category: "sedan",
    city: "Lahore",
    registered_date: "2025-01-01",
  };

  it("generateTripsForDateRange aggregates trips across days reproducibly", () => {
    const trips1 = generateTripsForDateRange(
      vehicle,
      mockConfig,
      "2025-01-05",
      "2025-01-07"
    );
    const trips2 = generateTripsForDateRange(
      vehicle,
      mockConfig,
      "2025-01-05",
      "2025-01-07"
    );

    expect(trips1).toEqual(trips2);
    // 3 days, each day 3-6 trips -> total 9-18 trips
    expect(trips1.length).toBeGreaterThanOrEqual(9);
    expect(trips1.length).toBeLessThanOrEqual(18);
  });

  it("getSummaryForPeriod computes correct totals for week and month", () => {
    const summary = getSummaryForPeriod(
      vehicle,
      mockConfig,
      "week",
      "2025-01-14"
    );

    expect(summary.period_start).toBe("2025-01-08");
    expect(summary.period_end).toBe("2025-01-14");
    expect(summary.trip_count).toBeGreaterThan(0);
    expect(summary.gross_revenue).toBeGreaterThan(0);
    expect(summary.fuel_cost).toBeGreaterThan(0);
    expect(summary.platform_fee).toBeGreaterThan(0);
    expect(summary.net_income).toBeGreaterThan(0);
    expect(summary.distance_km).toBeGreaterThan(0);

    // Verify mathematical identity
    const computedNet = Math.round(
      (summary.gross_revenue - summary.fuel_cost - summary.platform_fee) * 100
    ) / 100;
    expect(Math.abs(summary.net_income - computedNet)).toBeLessThanOrEqual(0.05); // minor rounding aggregation allowance
  });

  it("getTrendForDays produces the requested number of daily points", () => {
    const trend = getTrendForDays(vehicle, mockConfig, 14, "2025-01-14");
    expect(trend.length).toBe(14);
    expect(trend[trend.length - 1].date).toBe("2025-01-14");

    for (const pt of trend) {
      expect(pt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof pt.net).toBe("number");
      expect(pt.net).toBeGreaterThan(0);
    }
  });

  it("checkAnomalyForPeriod outputs structured baseline bounds and flag", () => {
    const result = checkAnomalyForPeriod(
      vehicle,
      mockConfig,
      "2025-01-01",
      "2025-01-10"
    );

    expect(typeof result.flagged).toBe("boolean");
    expect(result.reported_net).toBeGreaterThan(0);
    expect(result.expected_net_range.length).toBe(2);
    expect(result.expected_net_range[1]).toBeGreaterThan(result.expected_net_range[0]);

    if (result.flagged) {
      expect(["low", "medium", "high"]).toContain(result.severity);
      expect(result.reason).toBeTruthy();
    } else {
      expect(result.severity).toBeNull();
      expect(result.reason).toBeNull();
    }
  });

  it("calculateDistributionPreview computes clean monetary preview", () => {
    const preview = calculateDistributionPreview(
      vehicle,
      mockConfig,
      "2025-01-01",
      "2025-01-07"
    );

    expect(preview.gross_revenue).toBeGreaterThan(0);
    expect(preview.operating_expenses).toBeGreaterThan(0);
    expect(preview.platform_fee).toBeGreaterThan(0);
    expect(preview.net_distributable).toBe(
      Math.round(
        (preview.gross_revenue - preview.operating_expenses - preview.platform_fee) * 100
      ) / 100
    );
  });
});
