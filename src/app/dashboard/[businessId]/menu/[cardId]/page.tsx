import { notFound, redirect } from "next/navigation";
import MenuCardDetailManagement from "@/components/menu/MenuCardDetailManagement";
import { getMenuCardWorkspace } from "@/services/menu-management";

type MenuCardDetailPageProps = {
  params: Promise<{ businessId: string; cardId: string }>;
};

export default async function MenuCardDetailPage({
  params,
}: MenuCardDetailPageProps) {
  const { businessId: businessIdParam, cardId: cardIdParam } = await params;
  const businessId = Number(businessIdParam);
  const cardId = Number(cardIdParam);

  if (!Number.isFinite(businessId) || !Number.isFinite(cardId)) {
    notFound();
  }

  try {
    const workspace = await getMenuCardWorkspace(businessId, cardId);

    return (
      <MenuCardDetailManagement
        businessId={businessId}
        initialWorkspace={workspace}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/auth/signin");
    }

    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message.includes("not found"))
    ) {
      notFound();
    }

    throw error;
  }
}
