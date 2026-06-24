"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CategoryForm from "@/components/products/CategoryForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = useBusinessId();
  const categoryId = params?.categoryId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    if (!businessId || !categoryId) return;
    setLoading(true);
    fetch(`/api/categories?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find(
          (c: any) =>
            String(c.BUSINESS_PRODUCT_CATEGORY_ID) === String(categoryId)
        );
        setCategory(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load category");
        setLoading(false);
      });
  }, [businessId, categoryId]);

  async function handleEdit(values: {
    title: string;
    description: string;
    pic: string;
    status: number;
    tag_ids: number[];
  }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(categoryId),
          title: values.title,
          description: values.description,
          pic: values.pic,
          status: values.status,
          tag_ids: values.tag_ids,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update category");
      }
      router.push(`/dashboard/${businessId}/menu/categories`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">Loading category...</div>
    );
  }
  if (!category) {
    return (
      <div className="py-12 text-center text-red-500">Category not found.</div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
      </div>
      <CategoryForm
        mode="edit"
        initialValues={{
          title: category.TITLE,
          description: category.DESCRIPTION,
          pic: category.PIC,
          status: category.STATUS,
          tag_ids:
            category.tags?.map((tag: any) => tag.BUSINESS_PRODUCT_TAG_ID) ||
            [],
        }}
        onSubmit={handleEdit}
        loading={saving}
        error={error}
      />
    </div>
  );
}
