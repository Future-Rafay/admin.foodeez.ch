import AdminSettingsForm from "@/components/settings/AdminSettingsForm";
import {
  getBusinessInfo,
  getBusinessSettings,
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
    const [businessInfo, settings] = await Promise.all([
      getBusinessInfo(businessId),
      getBusinessSettings(businessId),
    ]);

    return (
      <AdminSettingsForm
        businessId={businessId}
        businessInfo={businessInfo}
        initialDeliveryAreas={settings?.deliveryAreas || ""}
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
