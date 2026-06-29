import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/services/admin-data";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.error("Notifications read-all API error:", error);
  return NextResponse.json(
    { error: "Failed to mark notifications as read" },
    { status: 500 }
  );
}

export async function PATCH(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isInteger(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  try {
    await requireBusinessAccess(businessId);
    await prisma.business_notification.updateMany({
      where: { BUSINESS_ID: businessId, IS_READ: 0 },
      data: { IS_READ: 1 },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
