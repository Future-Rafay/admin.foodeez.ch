import { NextResponse } from "next/server";
import {
  OrderStatus,
  updateOrderStatus,
} from "@/services/orders-management";

type OrderStatusRouteContext = {
  params: Promise<{ businessId: string; orderId: string }>;
};

const allowedStatuses: OrderStatus[] = [
  "preparing",
  "ready",
  "delivered",
  "rejected",
];

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

    if (error.message === "Invalid status transition") {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 409 }
      );
    }
  }

  console.error("Order status API error:", error);
  return NextResponse.json(
    { error: "Failed to update order status" },
    { status: 500 }
  );
}

export async function PATCH(
  req: Request,
  { params }: OrderStatusRouteContext
) {
  const { businessId: businessIdParam, orderId: orderIdParam } = await params;
  const businessId = Number(businessIdParam);
  const orderId = Number(orderIdParam);

  if (!Number.isFinite(businessId) || !Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid route params" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as OrderStatus | undefined;

  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(businessId, orderId, status);
    return NextResponse.json(order);
  } catch (error) {
    return errorResponse(error);
  }
}
