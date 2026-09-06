import {
  SimulationConfig,
  SummaryResponse,
  TrendPoint,
  Trip,
  AnomalyCheckResult,
  DistributionPreviewResult,
  VehicleCategory,
} from "./types";

const DEFAULT_KEY =
  process.env.NEXT_PUBLIC_SIMULATION_API_KEY || "carnaq_secret_key_2026";

export function getStoredApiKey(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("carnaq_api_key");
    if (saved) return saved;
  }
  return DEFAULT_KEY;
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("carnaq_api_key", key);
    // Also set as cookie for server-side / SSR requests
    document.cookie = `carnaq_sim_key=${encodeURIComponent(key)}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getStoredApiKey();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function fetchConfig(): Promise<SimulationConfig> {
  return apiRequest<SimulationConfig>("/api/config");
}

export async function updateConfig(
  key: string,
  value: any,
  updatedBy: string = "investor-admin@carnaq"
): Promise<any> {
  return apiRequest("/api/config", {
    method: "PATCH",
    body: JSON.stringify({ key, value, updated_by: updatedBy }),
  });
}

export interface VehicleProfileItem {
  id: string;
  category: VehicleCategory;
  city: string;
  registered_date: string;
  created_at?: string;
}

export async function fetchVehicles(
  category?: string,
  city?: string
): Promise<VehicleProfileItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (city) params.set("city", city);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<VehicleProfileItem[]>(`/api/vehicles${query}`);
}

export async function createVehicle(
  category: VehicleCategory,
  city: string,
  registered_date: string
): Promise<VehicleProfileItem> {
  return apiRequest<VehicleProfileItem>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify({ category, city, registered_date }),
  });
}

export async function seedDemoFleet(): Promise<{ message: string; vehicles: VehicleProfileItem[] }> {
  return apiRequest("/api/vehicles/demo", {
    method: "POST",
  });
}

export async function fetchVehicleTrips(
  id: string,
  from: string,
  to: string
): Promise<Trip[]> {
  return apiRequest<Trip[]>(`/api/vehicles/${id}/trips?from=${from}&to=${to}`);
}

export async function fetchVehicleSummary(
  id: string,
  period: "today" | "week" | "month" = "today"
): Promise<SummaryResponse> {
  return apiRequest<SummaryResponse>(`/api/vehicles/${id}/summary?period=${period}`);
}

export async function fetchVehicleTrend(
  id: string,
  days: number = 30
): Promise<TrendPoint[]> {
  return apiRequest<TrendPoint[]>(`/api/vehicles/${id}/trend?days=${days}`);
}

export async function checkVehicleAnomaly(
  id: string,
  period_start: string,
  period_end: string
): Promise<AnomalyCheckResult> {
  return apiRequest<AnomalyCheckResult>(`/api/vehicles/${id}/anomaly-check`, {
    method: "POST",
    body: JSON.stringify({ period_start, period_end }),
  });
}

export async function previewDistribution(
  vehicle_id: string,
  period_start: string,
  period_end: string
): Promise<DistributionPreviewResult> {
  return apiRequest<DistributionPreviewResult>("/api/distribute/preview", {
    method: "POST",
    body: JSON.stringify({ vehicle_id, period_start, period_end }),
  });
}
