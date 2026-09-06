import { NextRequest, NextResponse } from "next/server";
import { getAllConfigEntries, setConfigValue } from "@/lib/config";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchConfigSchema = z.object({
  key: z.string().min(1, "Config key is required"),
  value: z.any(),
  updated_by: z.string().min(1, "updated_by identifier is required"),
});

export async function GET() {
  try {
    const configEntries = await getAllConfigEntries();
    return NextResponse.json(configEntries, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch configuration:", error);
    return NextResponse.json(
      { error: "Failed to retrieve simulation config", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = patchConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { key, value, updated_by } = parsed.data;
    const record = await setConfigValue(key, value, updated_by);

    return NextResponse.json(record, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update configuration:", error);
    return NextResponse.json(
      { error: "Failed to update configuration", details: error.message },
      { status: 500 }
    );
  }
}
