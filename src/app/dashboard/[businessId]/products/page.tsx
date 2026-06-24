import { notFound, redirect } from "next/navigation";
import AdminProductsTable from "@/components/products/AdminProductsTable";
import { getProductsAdminData } from "@/services/admin-data";

type ProductsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  let data;

  try {
    data = await getProductsAdminData(businessId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/auth/signin");
    }

    if (error instanceof Error && error.message === "Forbidden") {
      notFound();
    }

    throw error;
  }

  return (
    <AdminProductsTable
      businessId={businessId}
      products={data.products}
      categories={data.categories}
    />
  );
}
