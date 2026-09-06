const API_KEY = "carnaq_secret_key_2026";
const BASE_URL = "http://localhost:3000";

async function main() {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  console.log("\n1. Testing GET /api/config...");
  const configRes = await fetch(`${BASE_URL}/api/config`, { headers });
  const config = await configRes.json();
  console.log("Config status:", configRes.status);
  console.log("Fuel price:", config.fuel_price_per_liter);

  console.log("\n2. Testing POST /api/vehicles...");
  const vehicleRes = await fetch(`${BASE_URL}/api/vehicles`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      category: "sedan",
      city: "Lahore",
      registered_date: "2025-01-15",
    }),
  });
  const vehicle = await vehicleRes.json();
  console.log("Vehicle created:", vehicle);

  const vehicleId = vehicle.id;

  console.log("\n3. Testing GET /api/vehicles/:id/trips...");
  const tripsRes = await fetch(
    `${BASE_URL}/api/vehicles/${vehicleId}/trips?from=2025-09-01&to=2025-09-02`,
    { headers }
  );
  const trips = await tripsRes.json();
  console.log("Generated trips count:", trips.length);
  console.log("Sample trip:", trips[0]);

  console.log("\n4. Testing GET /api/vehicles/:id/summary?period=week...");
  const summaryRes = await fetch(
    `${BASE_URL}/api/vehicles/${vehicleId}/summary?period=week`,
    { headers }
  );
  const summary = await summaryRes.json();
  console.log("Summary:", summary);

  console.log("\n5. Testing GET /api/vehicles/:id/trend?days=7...");
  const trendRes = await fetch(
    `${BASE_URL}/api/vehicles/${vehicleId}/trend?days=7`,
    { headers }
  );
  const trend = await trendRes.json();
  console.log("Trend points (7 days):", trend);

  console.log("\n6. Testing POST /api/vehicles/:id/anomaly-check...");
  const anomalyRes = await fetch(
    `${BASE_URL}/api/vehicles/${vehicleId}/anomaly-check`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        period_start: "2025-09-01",
        period_end: "2025-09-07",
      }),
    }
  );
  const anomaly = await anomalyRes.json();
  console.log("Anomaly check:", anomaly);

  console.log("\n7. Testing POST /api/distribute/preview...");
  const previewRes = await fetch(`${BASE_URL}/api/distribute/preview`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      vehicle_id: vehicleId,
      period_start: "2025-09-01",
      period_end: "2025-09-07",
    }),
  });
  const preview = await previewRes.json();
  console.log("Distribution Preview:", preview);

  console.log("\n8. Testing Unauthorized request (missing token)...");
  const unauthRes = await fetch(`${BASE_URL}/api/config`);
  console.log("Unauthorized status:", unauthRes.status);
}

main().catch(console.error);
