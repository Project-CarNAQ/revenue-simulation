export type VehicleCategory = "hatchback" | "sedan" | "suv";

export type TripCategory = "ride_hailing" | "self_drive_rental" | "wedding_event";

export interface CategoryFuelEfficiency {
  hatchback: number;
  sedan: number;
  suv: number;
}

export interface CategoryFareRate {
  hatchback: number;
  sedan: number;
  suv: number;
}

export interface FlatFareRanges {
  self_drive_rental: {
    hatchback: [number, number];
    sedan: [number, number];
    suv: [number, number];
    [key: string]: [number, number];
  };
  wedding_event: {
    hatchback: [number, number];
    sedan: [number, number];
    suv: [number, number];
    [key: string]: [number, number];
  };
  [key: string]: Record<string, [number, number]>;
}

export interface SimulationConfig {
  fuel_price_per_liter: number;
  fuel_efficiency_km_per_liter: number | CategoryFuelEfficiency;
  platform_fee_rate: number;
  driver_commission_split: number;
  variance_range: [number, number];
  trip_count_range_per_day: [number, number];
  category_weights: {
    ride_hailing: number;
    self_drive_rental: number;
    wedding_event: number;
    [key: string]: number;
  };
  fare_rate_per_km_by_category: CategoryFareRate;
  flat_fare_range_by_category: FlatFareRanges;
  seasonality_multipliers: {
    weekend?: number;
    [key: string]: number | undefined;
  };
}

export interface Trip {
  date: string;
  time: string;
  category: TripCategory;
  from_area: string;
  to_area: string;
  distance_km: number;
  duration_min: number;
  gross_fare: number;
  fuel_cost: number;
  platform_fee: number;
  net: number;
}

export interface SummaryResponse {
  trip_count: number;
  gross_revenue: number;
  fuel_cost: number;
  platform_fee: number;
  net_income: number;
  distance_km: number;
  period_start: string;
  period_end: string;
}

export interface TrendPoint {
  date: string;
  net: number;
}

export interface AnomalyCheckResult {
  flagged: boolean;
  severity: "low" | "medium" | "high" | null;
  reason: string | null;
  reported_net: number;
  expected_net_range: [number, number];
}

export interface DistributionPreviewResult {
  gross_revenue: number;
  operating_expenses: number;
  platform_fee: number;
  net_distributable: number;
}
