import { NextResponse } from "next/server";
import { deleteMenuCard, updateMenuCard } from "@/services/menu-management";
import { apiError, parseId } from "../route-utils";

type RouteContext = {
  params: Promise<{ businessId: string; cardId: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, cardId: cardIdParam } = await params;
  const businessId = parseId(businessIdParam);
  const cardId = parseId(cardIdParam);

  if (!businessId || !cardId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    const menuCard = await updateMenuCard(businessId, cardId, await req.json());

    return NextResponse.json({ menuCard });
  } catch (error) {
    return apiError(error, "Failed to update menu card");
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, cardId: cardIdParam } = await params;
  const businessId = parseId(businessIdParam);
  const cardId = parseId(cardIdParam);

  if (!businessId || !cardId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    await deleteMenuCard(businessId, cardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete menu card");
  }
}
