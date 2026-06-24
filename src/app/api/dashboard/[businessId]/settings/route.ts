import { NextResponse } from "next/server";
import {
  getBusinessSettings,
  upsertBusinessSettings,
} from "@/services/settings-management";

type SettingsRouteContext = {
  params: Promise<{ businessId: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  console.error("Settings API error:", error);
  return NextResponse.json(
    { error: "Failed to process settings request" },
    { status: 500 }
  );
}

export async function GET(_req: Request, { params }: SettingsRouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    const settings = await getBusinessSettings(businessId);
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request, { params }: SettingsRouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body.deliveryAreas !== "string") {
    return NextResponse.json(
      { error: "deliveryAreas is required" },
      { status: 400 }
    );
  }

  try {
    const settings = await upsertBusinessSettings(
      businessId,
      body.deliveryAreas
    );
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}
