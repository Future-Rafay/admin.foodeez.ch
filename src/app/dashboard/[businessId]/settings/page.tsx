import AdminSettingsForm from "@/components/settings/AdminSettingsForm";
import {
  getBusinessSettings,
  getFulfillmentSettings,
} from "@/services/settings-management";
import { notFound, redirect } from "next/navigation";

type SettingsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  try {
    const [settings, fulfillmentSettings] = await Promise.all([
      getBusinessSettings(businessId),
      getFulfillmentSettings(businessId),
    ]);

    return (
      <AdminSettingsForm
        businessId={businessId}
        initialDeliveryAreas={settings?.deliveryAreas || ""}
        initialFulfillmentSettings={fulfillmentSettings}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/auth/signin");
    }

    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Business not found")
    ) {
      notFound();
    }

    throw error;
  }
}
