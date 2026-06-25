import { NextResponse } from "next/server";
import { listOrders } from "@/services/orders-management";

type OrdersRouteContext = {
  params: Promise<{ businessId: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Invalid businessId") {
      return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
    }

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  console.error("Orders API error:", error);
  return NextResponse.json(
    { error: "Failed to load orders" },
    { status: 500 }
  );
}

export async function GET(req: Request, { params }: OrdersRouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseInt(businessIdParam, 10);

  if (!Number.isInteger(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);

  try {
    const data = await listOrders({
      businessId,
      status: searchParams.get("status"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      search: searchParams.get("search"),
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 20),
    });

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
