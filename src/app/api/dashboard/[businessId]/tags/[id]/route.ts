import { NextResponse } from "next/server";
import { deleteMenuTag, updateMenuTag } from "@/services/menu-management";

type RouteContext = {
  params: Promise<{ businessId: string; id: string }>;
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

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, id: idParam } = await params;
  const businessId = parseId(businessIdParam);
  const tagId = parseId(idParam);

  if (!businessId || !tagId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    const tag = await updateMenuTag(businessId, tagId, await req.json());

    return NextResponse.json({ tag });
  } catch (error) {
    return apiError(error, "Failed to update tag");
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, id: idParam } = await params;
  const businessId = parseId(businessIdParam);
  const tagId = parseId(idParam);

  if (!businessId || !tagId) {
    return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
  }

  try {
    await deleteMenuTag(businessId, tagId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete tag");
  }
}
