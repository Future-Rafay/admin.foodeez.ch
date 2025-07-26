"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = useBusinessId();
  const productId = params?.productId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!businessId || !productId) return;
    setLoading(true);
    fetch(`/api/products?businessId=${businessId}`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((p: any) => String(p.BUSINESS_PRODUCT_ID) === String(productId));
        setProduct(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setLoading(false);
      });
  }, [businessId, productId]);

  async function handleEdit(values: { title: string; description: string; product_price: string; pic: string }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(productId),
          title: values.title,
          description: values.description,
          product_price: values.product_price,
          pic: values.pic,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update product");
      }
      router.push(`/dashboard/${businessId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading...</div>;
  }
  if (!product) {
    return <div className="text-center text-red-500 py-8">Product not found.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm
        mode="edit"
        initialValues={{
          title: product.TITLE,
          description: product.DESCRIPTION,
          product_price: product.PRODUCT_PRICE,
          pic: product.PIC,
        }}
        onSubmit={handleEdit}
        loading={saving}
        error={error}
      />
    </div>
  );
} 