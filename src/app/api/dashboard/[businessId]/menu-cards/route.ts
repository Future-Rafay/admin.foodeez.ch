import { NextResponse } from "next/server";
import { createMenuCard, listMenuCards } from "@/services/menu-management";
import { apiError, parseId } from "./route-utils";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    return NextResponse.json({ menuCards: await listMenuCards(businessId) });
  } catch (error) {
    return apiError(error, "Failed to load menu cards");
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    const menuCard = await createMenuCard(businessId, await req.json());

    return NextResponse.json({ menuCard }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create menu card");
  }
}
