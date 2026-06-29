import { NextResponse } from "next/server";
import { calculateDeliveryQuote } from "@/lib/fulfillment";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

function parseBusinessId(value: string) {
  const businessId = Number(value);
  return Number.isInteger(businessId) && businessId > 0 ? businessId : null;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const postalCode = String(body?.postalCode ?? "").trim();
  const cartTotal = Number(body?.cartTotal);

  if (!postalCode) {
    return NextResponse.json({ error: "postalCode is required" }, { status: 400 });
  }

  if (!Number.isFinite(cartTotal) || cartTotal < 0) {
    return NextResponse.json(
      { error: "cartTotal must be greater than or equal to 0" },
      { status: 400 }
    );
  }

  const quote = await calculateDeliveryQuote({
    businessId,
    postalCode,
    cartTotal,
  });

  return NextResponse.json(quote);
}
