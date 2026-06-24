"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function AddProductPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(values: {
    title: string;
    description: string;
    product_price: string;
    pic: string;
    tag_ids: number[];
  }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/${businessId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          product_price: values.product_price,
          pic: values.pic,
          tag_ids: values.tag_ids,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add product");
      }

      router.push(`/dashboard/${businessId}/menu/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        </div>
      </div>
      <ProductForm
        mode="add"
        onSubmit={handleAdd}
        loading={loading}
        error={error}
      />
    </div>
  );
}
