import CategoryTable from "@/components/products/CategoryTable";
import { listMenuCategories } from "@/services/menu-management";
import { notFound, redirect } from "next/navigation";

type MenuCategoriesPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function MenuCategoriesPage({
  params,
}: MenuCategoriesPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  try {
    const categories = await listMenuCategories(businessId);

    return <CategoryTable businessId={businessId} initialCategories={categories} />;
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
