import prisma from "@/lib/prisma";

export type BusinessNotificationType =
  | "order"
  | "refund"
  | "system"
  | "menu"
  | "payment";

export async function createBusinessNotification({
  businessId,
  type,
  title,
  message,
  linkUrl,
  metadata,
}: {
  businessId: number;
  type: BusinessNotificationType;
  title: string;
  message?: string | null;
  linkUrl?: string | null;
  metadata?: unknown;
}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.business_notification.create({
    data: {
      BUSINESS_ID: businessId,
      NOTIFICATION_TYPE: type,
      TITLE: title,
      MESSAGE: message || null,
      LINK_URL: linkUrl || null,
      METADATA_JSON:
        metadata === undefined ? null : JSON.stringify(metadata),
      EXPIRES_AT: expiresAt,
    },
  });
}
