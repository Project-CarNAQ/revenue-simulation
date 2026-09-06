import { NextRequest, NextResponse } from "next/server";
import { createVehicleProfile, listVehicleProfiles } from "@/lib/vehicles";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createVehicleSchema = z.object({
  category: z.enum(["hatchback", "sedan", "suv"], {
    errorMap: () => ({ message: "Category must be one of: hatchback, sedan, suv" }),
  }),
  city: z.string().min(1, "City is required"),
  registered_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "registered_date must be in YYYY-MM-DD format"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;

    const vehicles = await listVehicleProfiles(category, city);
    return NextResponse.json(vehicles, { status: 200 });
  } catch (error: any) {
    console.error("Failed to list vehicle profiles:", error);
    return NextResponse.json(
      { error: "Failed to list vehicle profiles", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { category, city, registered_date } = parsed.data;
    const vehicle = await createVehicleProfile(category, city, registered_date);

    return NextResponse.json(
      {
        id: vehicle.id,
        category: vehicle.category,
        city: vehicle.city,
        registered_date: vehicle.registered_date,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create vehicle profile:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle profile", details: error.message },
      { status: 500 }
    );
  }
}
