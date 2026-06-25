import { NextResponse } from "next/server";
import { removeMenuCardDetail } from "@/services/menu-management";
import { apiError, parseId } from "../../../route-utils";

type RouteContext = {
  params: Promise<{ businessId: string; cardId: string; detailId: string }>;
};

export async function DELETE(_req: Request, { params }: RouteContext) {
  const {
    businessId: businessIdParam,
    cardId: cardIdParam,
    detailId: detailIdParam,
  } = await params;
  const businessId = parseId(businessIdParam);
  const cardId = parseId(cardIdParam);
  const detailId = parseId(detailIdParam);

  if (!businessId || !cardId || !detailId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    await removeMenuCardDetail(businessId, cardId, detailId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to remove category from menu card");
  }
}
