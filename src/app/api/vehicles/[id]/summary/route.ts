import { NextRequest, NextResponse } from "next/server";
import { getVehicleProfileById, toVehicleContext } from "@/lib/vehicles";
import { getActiveConfig } from "@/lib/config";
import { getSummaryForPeriod } from "@/lib/analytics";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const summaryQuerySchema = z.object({
  period: z.enum(["today", "week", "month"], {
    errorMap: () => ({ message: "period must be one of: today, week, month" }),
  }),
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
    const periodParam = searchParams.get("period") || "today";
    const queryResult = summaryQuerySchema.safeParse({ period: periodParam });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid period parameter",
          issues: queryResult.error.issues,
        },
        { status: 400 }
      );
    }

    const config = await getActiveConfig();
    const vehicleContext = toVehicleContext(vehicle);
    const summary = getSummaryForPeriod(
      vehicleContext,
      config,
      queryResult.data.period
    );

    return NextResponse.json(summary, { status: 200 });
  } catch (error: any) {
    console.error("Failed to calculate vehicle summary:", error);
    return NextResponse.json(
      { error: "Failed to calculate summary", details: error.message },
      { status: 500 }
    );
  }
}
