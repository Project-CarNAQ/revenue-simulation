# CarNAQ Revenue Simulation Engine

A standalone, deterministic microservice for revenue simulation in the CarNAQ platform, deployed independently on Vercel.

It has no knowledge of users, KYC, ownership tokens, or blockchain — it is a pure calculator, not a system of record. The main CarNAQ platform calls its endpoints and decides for itself what to persist.

## Core Principles

- **Deterministic, Not Stored**: Trips are never stored. Generation is a pure, seeded PRNG function of `(vehicle_id, day_index, config)` using Mulberry32 and FNV-1a.
- **Day Index**: `day_index` is the number of days elapsed since the vehicle's `registered_date`. "Today's" data is simply whatever `day_index` maps to right now — no cron job, background worker, or queue is needed.
- **Strictly Two Database Tables**: Only `vehicle_profiles` and `simulation_config` exist in Neon Serverless Postgres. No transactions table, no users table.
- **Shared API Key Authentication**: Protected by middleware against `Authorization: Bearer <SIMULATION_API_KEY>`.
- **Financial Precision**: All monetary values are rounded to 2 decimal places with zero floating-point artifacts.

---

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Runtime**: Node.js runtime for all API routes (`export const runtime = "nodejs"`)
- **Database**: Neon Serverless Postgres via `@neondatabase/serverless` & Drizzle ORM
- **Testing**: Vitest

---

## Database Schema

```sql
CREATE TABLE vehicle_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('hatchback', 'sedan', 'suv')),
  city TEXT NOT NULL,
  registered_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE simulation_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
DATABASE_URL=postgresql://neondb_owner:...@ep-...aws.neon.tech/neondb?sslmode=require
SIMULATION_API_KEY=your_secure_api_key_here
ALLOWED_ORIGIN=*
```

---

## Setup & Seeding

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed configuration into database**:
   Seeds default values from `config/defaults.json` with `ON CONFLICT (key) DO NOTHING`:
   ```bash
   npm run db:seed
   ```

3. **Run test suite**:
   ```bash
   npm test
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

---

## API Endpoints

All endpoints require the header:
```http
Authorization: Bearer <SIMULATION_API_KEY>
```

### 1. Configuration
- **`GET /api/config`**
  - Returns current key-value simulation configuration.
- **`PATCH /api/config`**
  - Body: `{ "key": "fuel_price_per_liter", "value": 285, "updated_by": "admin@carnaq" }`
  - Updates a specific configuration parameter.

### 2. Vehicle Profiles
- **`POST /api/vehicles`**
  - Body: `{ "category": "sedan", "city": "Lahore", "registered_date": "2025-01-15" }`
  - Returns `201 { id, category, city, registered_date }`
- **`GET /api/vehicles/:id`**
  - Returns vehicle profile or `404`.
- **`PATCH /api/vehicles/:id`**
  - Body: `{ "category"?: "suv", "city"?: "Karachi" }`
  - Updates category or city.
- **`DELETE /api/vehicles/:id`**
  - Returns `204 No Content`.

### 3. Deterministic Trips & Analytics
- **`GET /api/vehicles/:id/trips?from=2025-09-01&to=2025-09-07`**
  - Generates deterministic trips for the specified date range.
  - Output:
    ```json
    [
      {
        "date": "2025-09-01",
        "time": "08:15",
        "category": "ride_hailing",
        "from_area": "Gulberg III",
        "to_area": "DHA Phase 5",
        "distance_km": 14.2,
        "duration_min": 38,
        "gross_fare": 1050.25,
        "fuel_cost": 328.98,
        "platform_fee": 52.51,
        "net": 668.76
      }
    ]
    ```
- **`GET /api/vehicles/:id/summary?period=today|week|month`**
  - Returns financial summary (`trip_count`, `gross_revenue`, `fuel_cost`, `platform_fee`, `net_income`, `distance_km`, `period_start`, `period_end`).
- **`GET /api/vehicles/:id/trend?days=30`**
  - Returns daily points for charting: `[{ "date": "2025-09-01", "net": 2450.50 }, ...]`.
- **`POST /api/vehicles/:id/anomaly-check`**
  - Body: `{ "period_start": "2025-09-01", "period_end": "2025-09-07" }`
  - Returns rule-based anomaly check comparing reported net against expected category baseline range:
    ```json
    {
      "flagged": false,
      "severity": null,
      "reason": null,
      "reported_net": 16540.20,
      "expected_net_range": [12800.00, 21500.00]
    }
    ```
- **`POST /api/distribute/preview`**
  - Body: `{ "vehicle_id": "<uuid>", "period_start": "2025-09-01", "period_end": "2025-09-07" }`
  - Returns pure math distribution preview:
    ```json
    {
      "gross_revenue": 21500.00,
      "operating_expenses": 5200.00,
      "platform_fee": 1075.00,
      "net_distributable": 15225.00
    }
    ```

---

## Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Import project into Vercel (Next.js preset is auto-detected).
3. Set Environment Variables in Vercel:
   - `DATABASE_URL`: Connection string to Neon serverless Postgres project.
   - `SIMULATION_API_KEY`: Strong random secret token.
   - `ALLOWED_ORIGIN`: Allowed CarNAQ platform URL (or `*` during initial testing).
4. Run the seed command against your Neon database:
   ```bash
   DATABASE_URL="<your_neon_url>" npm run db:seed
   ```
5. Deploy!
