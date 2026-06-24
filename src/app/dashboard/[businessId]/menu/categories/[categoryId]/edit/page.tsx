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
    fetch(`/api/dashboard/${businessId}/categories`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.categories.find(
          (c: any) => String(c.id) === String(categoryId)
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
      const res = await fetch(
        `/api/dashboard/${businessId}/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            pic: values.pic,
            status: values.status === 1 ? "active" : "inactive",
            tag_ids: values.tag_ids,
          }),
        }
      );
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
          title: category.title,
          description: category.description,
          pic: category.pic,
          status: category.status === "active" ? 1 : 0,
          tag_ids: category.tagIds || [],
        }}
        onSubmit={handleEdit}
        loading={saving}
        error={error}
      />
    </div>
  );
}
