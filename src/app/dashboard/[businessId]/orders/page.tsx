import { notFound } from "next/navigation";
import AdminOrdersPage from "@/components/orders/AdminOrdersPage";

type OrdersPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  return <AdminOrdersPage businessId={businessId} />;
}
