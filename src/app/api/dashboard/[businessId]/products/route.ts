import { NextResponse } from "next/server";
import {
  createMenuProduct,
  listMenuProducts,
} from "@/services/menu-management";

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

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

function parseBusinessId(value: string) {
  const businessId = Number(value);
  return Number.isFinite(businessId) ? businessId : null;
}

export async function GET(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);

  try {
    return NextResponse.json(
      await listMenuProducts({
        businessId,
        search: searchParams.get("search"),
        categoryId: searchParams.get("categoryId"),
        status: searchParams.get("status"),
        page: Number(searchParams.get("page") || 1),
        pageSize: Number(searchParams.get("pageSize") || 20),
      })
    );
  } catch (error) {
    return apiError(error, "Failed to load products");
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    const product = await createMenuProduct(businessId, await req.json());

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create product");
  }
}
