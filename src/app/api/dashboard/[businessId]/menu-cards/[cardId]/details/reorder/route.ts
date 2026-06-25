import { NextResponse } from "next/server";
import { reorderMenuCardDetails } from "@/services/menu-management";
import { apiError, parseId } from "../../../route-utils";

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
    const details = await reorderMenuCardDetails(
      businessId,
      cardId,
      await req.json()
    );

    return NextResponse.json({ details });
  } catch (error) {
    return apiError(error, "Failed to reorder menu card categories");
  }
}
