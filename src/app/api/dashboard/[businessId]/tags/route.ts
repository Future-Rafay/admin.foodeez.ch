import { NextResponse } from "next/server";
import { createMenuTag, listMenuTags } from "@/services/menu-management";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

function apiError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

function parseBusinessId(value: string) {
  const businessId = Number(value);
  return Number.isFinite(businessId) ? businessId : null;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    return NextResponse.json({ tags: await listMenuTags(businessId) });
  } catch (error) {
    return apiError(error, "Failed to load tags");
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const tag = await createMenuTag(businessId, body.title);

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create tag");
  }
}
