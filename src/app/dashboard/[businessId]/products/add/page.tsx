"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";
import { useBusinessId } from "@/components/ui/providers/BusinessProvider";

export default function AddProductPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(values: { title: string; description: string; product_price: string; pic: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: Number(businessId),
          title: values.title,
          description: values.description,
          product_price: values.product_price,
          pic: values.pic,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add product");
      }
      router.push(`/dashboard/${businessId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=" p-4">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
      <ProductForm mode="add" onSubmit={handleAdd} loading={loading} error={error} />
    </div>
  );
} 