import { NextRequest, NextResponse } from "next/server";
import {
  getVehicleProfileById,
  updateVehicleProfile,
  deleteVehicleProfile,
} from "@/lib/vehicles";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchVehicleSchema = z.object({
  category: z.enum(["hatchback", "sedan", "suv"]).optional(),
  city: z.string().min(1).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

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

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error: any) {
    console.error("Failed to retrieve vehicle profile:", error);
    return NextResponse.json(
      { error: "Failed to retrieve vehicle profile", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const vehicle = await getVehicleProfileById(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = patchVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await updateVehicleProfile(id, parsed.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update vehicle profile:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle profile", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const vehicle = await getVehicleProfileById(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle profile not found" },
        { status: 404 }
      );
    }

    await deleteVehicleProfile(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Failed to delete vehicle profile:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle profile", details: error.message },
      { status: 500 }
    );
  }
}
