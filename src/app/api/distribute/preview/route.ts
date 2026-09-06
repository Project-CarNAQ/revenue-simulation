import { NextRequest, NextResponse } from "next/server";
import { getVehicleProfileById, toVehicleContext } from "@/lib/vehicles";
import { getActiveConfig } from "@/lib/config";
import { calculateDistributionPreview } from "@/lib/analytics";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const distributePreviewSchema = z.object({
  vehicle_id: z.string().uuid("vehicle_id must be a valid UUID"),
  period_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "period_start must be in YYYY-MM-DD format"),
  period_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "period_end must be in YYYY-MM-DD format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = distributePreviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { vehicle_id, period_start, period_end } = parsed.data;

    if (period_start > period_end) {
      return NextResponse.json(
        { error: "period_start cannot be after period_end" },
        { status: 400 }
      );
    }

    const vehicle = await getVehicleProfileById(vehicle_id);
    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle profile not found" },
        { status: 404 }
      );
    }

    const config = await getActiveConfig();
    const vehicleContext = toVehicleContext(vehicle);
    const result = calculateDistributionPreview(
      vehicleContext,
      config,
      period_start,
      period_end
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to generate distribution preview:", error);
    return NextResponse.json(
      { error: "Failed to generate distribution preview", details: error.message },
      { status: 500 }
    );
  }
}
