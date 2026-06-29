import { NextResponse } from "next/server";
import { updateOrderEta } from "@/services/orders-management";

type OrderEtaRouteContext = {
  params: Promise<{ businessId: string; orderId: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error.message === "Order not found") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      error.message === "Invalid route params" ||
      error.message === "ETA is required"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  console.error("Order ETA API error:", error);
  return NextResponse.json({ error: "Failed to update ETA" }, { status: 500 });
}

export async function PATCH(req: Request, { params }: OrderEtaRouteContext) {
  const { businessId: businessIdParam, orderId: orderIdParam } = await params;
  const body = await req.json().catch(() => null);

  try {
    const order = await updateOrderEta(
      Number(businessIdParam),
      Number(orderIdParam),
      String(body?.eta ?? "")
    );
    return NextResponse.json(order);
  } catch (error) {
    return errorResponse(error);
  }
}
