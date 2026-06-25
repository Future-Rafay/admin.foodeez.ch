import { notFound, redirect } from "next/navigation";
import MenuCardsManagement from "@/components/menu/MenuCardsManagement";
import { listMenuCards } from "@/services/menu-management";

type MenuPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function MenuPage({ params }: MenuPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  try {
    const menuCards = await listMenuCards(businessId);

    return (
      <MenuCardsManagement
        businessId={businessId}
        initialMenuCards={menuCards}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/auth/signin");
    }

    if (error instanceof Error && error.message === "Forbidden") {
      notFound();
    }

    throw error;
  }
}
