import { NextResponse } from "next/server";
import {
  addMenuCardDetail,
  getMenuCardWorkspace,
} from "@/services/menu-management";
import { apiError, parseId } from "../../route-utils";

type RouteContext = {
  params: Promise<{ businessId: string; cardId: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, cardId: cardIdParam } = await params;
  const businessId = parseId(businessIdParam);
  const cardId = parseId(cardIdParam);

  if (!businessId || !cardId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getMenuCardWorkspace(businessId, cardId));
  } catch (error) {
    return apiError(error, "Failed to load menu card details");
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, cardId: cardIdParam } = await params;
  const businessId = parseId(businessIdParam);
  const cardId = parseId(cardIdParam);

  if (!businessId || !cardId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    const detail = await addMenuCardDetail(businessId, cardId, await req.json());

    return NextResponse.json({ detail }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to add category to menu card");
  }
}
