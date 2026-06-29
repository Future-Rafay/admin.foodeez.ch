import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/services/admin-data";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

function parseBusinessId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.error("Notifications API error:", error);
  return NextResponse.json(
    { error: "Failed to load notifications" },
    { status: 500 }
  );
}

export async function GET(req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam } = await params;
  const businessId = parseBusinessId(businessIdParam);

  if (!businessId) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const now = new Date();

  try {
    await requireBusinessAccess(businessId);
    await prisma.business_notification.deleteMany({
      where: { BUSINESS_ID: businessId, EXPIRES_AT: { lt: now } },
    });

    const notifications = await prisma.business_notification.findMany({
      where: {
        BUSINESS_ID: businessId,
        ...(unreadOnly ? { IS_READ: 0 } : {}),
        EXPIRES_AT: { gte: now },
      },
      orderBy: { CREATION_DATETIME: "desc" },
      take: limit,
    });
    const unreadCount = await prisma.business_notification.count({
      where: {
        BUSINESS_ID: businessId,
        IS_READ: 0,
        EXPIRES_AT: { gte: now },
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}
