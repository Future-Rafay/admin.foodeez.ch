"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "@/components/products/CategoryForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function AddCategoryPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(values: {
    title: string;
    description: string;
    pic: string;
    status: number;
    tag_ids: number[];
  }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/${businessId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          pic: values.pic,
          status: values.status === 1 ? "active" : "inactive",
          tag_ids: values.tag_ids,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add category");
      }

      router.push(`/dashboard/${businessId}/menu/categories`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Add Category</h1>
      </div>
      <CategoryForm
        mode="add"
        onSubmit={handleAdd}
        loading={loading}
        error={error}
      />
    </div>
  );
}
