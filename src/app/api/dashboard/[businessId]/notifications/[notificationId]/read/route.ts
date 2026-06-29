import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/services/admin-data";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ businessId: string; notificationId: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.error("Notification read API error:", error);
  return NextResponse.json(
    { error: "Failed to mark notification as read" },
    { status: 500 }
  );
}

export async function PATCH(_req: Request, { params }: RouteContext) {
  const { businessId: businessIdParam, notificationId: notificationIdParam } =
    await params;
  const businessId = Number(businessIdParam);
  const notificationId = Number(notificationIdParam);

  if (!Number.isInteger(businessId) || !Number.isInteger(notificationId)) {
    return NextResponse.json({ error: "Invalid route params" }, { status: 400 });
  }

  try {
    await requireBusinessAccess(businessId);
    const result = await prisma.business_notification.updateMany({
      where: {
        BUSINESS_ID: businessId,
        BUSINESS_NOTIFICATION_ID: notificationId,
      },
      data: { IS_READ: 1 },
    });

    if (!result.count) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
