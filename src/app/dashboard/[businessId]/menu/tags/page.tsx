import TagsTable from "@/components/products/TagsTable";
import { listMenuTags } from "@/services/menu-management";
import { notFound, redirect } from "next/navigation";

type MenuTagsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function MenuTagsPage({ params }: MenuTagsPageProps) {
  const { businessId: businessIdParam } = await params;
  const businessId = Number(businessIdParam);

  if (!Number.isFinite(businessId)) {
    notFound();
  }

  try {
    const tags = await listMenuTags(businessId);

    return <TagsTable businessId={businessId} initialTags={tags} />;
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
