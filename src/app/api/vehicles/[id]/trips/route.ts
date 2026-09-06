import { NextRequest, NextResponse } from "next/server";
import { getVehicleProfileById, toVehicleContext } from "@/lib/vehicles";
import { getActiveConfig } from "@/lib/config";
import { generateTripsForDateRange } from "@/lib/analytics";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const tripsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from must be formatted as YYYY-MM-DD"),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "to must be formatted as YYYY-MM-DD"),
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
    const queryResult = tripsQuerySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters. Both 'from' and 'to' (YYYY-MM-DD) are required.",
          issues: queryResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { from, to } = queryResult.data;
    if (from > to) {
      return NextResponse.json(
        { error: "'from' date cannot be after 'to' date." },
        { status: 400 }
      );
    }

    const config = await getActiveConfig();
    const vehicleContext = toVehicleContext(vehicle);
    const trips = generateTripsForDateRange(vehicleContext, config, from, to);

    return NextResponse.json(trips, { status: 200 });
  } catch (error: any) {
    console.error("Failed to generate trips:", error);
    return NextResponse.json(
      { error: "Failed to generate trips", details: error.message },
      { status: 500 }
    );
  }
}
