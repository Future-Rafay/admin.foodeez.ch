import prisma from "@/lib/prisma";
import { requireBusinessAccess } from "@/services/admin-data";

export type BusinessSettingsRow = {
  id: number;
  businessId: number;
  deliveryAreas: string;
};

export type BusinessInfo = {
  name: string;
  email: string;
};

export function normalizeDeliveryAreas(value: string) {
  return value
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean)
    .join(", ");
}

export async function getBusinessInfo(businessId: number): Promise<BusinessInfo> {
  await requireBusinessAccess(businessId);

  const business = await prisma.business.findUnique({
    where: { BUSINESS_ID: businessId },
    select: {
      BUSINESS_NAME: true,
      EMAIL_ADDRESS: true,
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  return {
    name: business.BUSINESS_NAME || `Business #${businessId}`,
    email: business.EMAIL_ADDRESS || "Not provided",
  };
}

export async function getBusinessSettings(
  businessId: number
): Promise<BusinessSettingsRow | null> {
  await requireBusinessAccess(businessId);

  const settings = await prisma.business_settings.findUnique({
    where: { BUSINESS_ID: businessId },
  });

  if (!settings) return null;

  return {
    id: settings.BUSINESS_SETTINGS_ID,
    businessId: settings.BUSINESS_ID,
    deliveryAreas: settings.DELIVERY_RANGE_ZIP_CODES || "",
  };
}

export async function upsertBusinessSettings(
  businessId: number,
  deliveryAreas: string
) {
  await requireBusinessAccess(businessId);

  const normalizedDeliveryAreas = normalizeDeliveryAreas(deliveryAreas);

  const settings = await prisma.business_settings.upsert({
    where: { BUSINESS_ID: businessId },
    create: {
      BUSINESS_ID: businessId,
      DELIVERY_RANGE_ZIP_CODES: normalizedDeliveryAreas,
    },
    update: {
      DELIVERY_RANGE_ZIP_CODES: normalizedDeliveryAreas,
      LAST_UPDATE_DATETIME: new Date(),
    },
  });

  return {
    id: settings.BUSINESS_SETTINGS_ID,
    businessId: settings.BUSINESS_ID,
    deliveryAreas: settings.DELIVERY_RANGE_ZIP_CODES || "",
  };
}
