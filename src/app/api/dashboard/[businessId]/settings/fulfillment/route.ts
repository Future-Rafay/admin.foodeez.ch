import { NextResponse } from "next/server";
import {
  getFulfillmentSettings,
  updateFulfillmentSettings,
} from "@/services/settings-management";

type FulfillmentSettingsRouteContext = {
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

    if (error.message === "Business owner not found") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("Fulfillment settings API error:", error);
  return NextResponse.json(
    { error: "Failed to process fulfillment settings request" },
    { status: 500 }
  );
}

function parseBusinessId(value: string) {
  const businessId = Number(value);
  return Number.isFinite(businessId) ? businessId : null;
}

export async function GET(
  _req: Request,
  { params }: FulfillmentSettingsRouteContext
) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    const settings = await getFulfillmentSettings(businessId);
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: FulfillmentSettingsRouteContext
) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Request body is required" },
      { status: 400 }
    );
  }

  try {
    const settings = await updateFulfillmentSettings(businessId, body);
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}
