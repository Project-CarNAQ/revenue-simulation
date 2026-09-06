import { NextRequest, NextResponse } from "next/server";
import { getVehicleProfileById, toVehicleContext } from "@/lib/vehicles";
import { getActiveConfig } from "@/lib/config";
import { getTrendForDays } from "@/lib/analytics";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const trendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const vehicle = await getVehicleProfileById(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle profile not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawDays = searchParams.get("days") || "30";
    const queryResult = trendQuerySchema.safeParse({ days: rawDays });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid days parameter. Must be an integer between 1 and 365.",
          issues: queryResult.error.issues,
        },
        { status: 400 }
      );
    }

    const config = await getActiveConfig();
    const vehicleContext = toVehicleContext(vehicle);
    const trend = getTrendForDays(vehicleContext, config, queryResult.data.days);

    return NextResponse.json(trend, { status: 200 });
  } catch (error: any) {
    console.error("Failed to calculate vehicle trend:", error);
    return NextResponse.json(
      { error: "Failed to calculate trend", details: error.message },
      { status: 500 }
    );
  }
}
