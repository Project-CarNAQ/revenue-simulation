import { NextRequest, NextResponse } from "next/server";
import { seedDemoVehicles } from "@/lib/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const created = await seedDemoVehicles();
    return NextResponse.json(
      { message: "Demo fleet generated successfully", vehicles: created },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to seed demo fleet:", error);
    return NextResponse.json(
      { error: "Failed to seed demo fleet", details: error.message },
      { status: 500 }
    );
  }
}
