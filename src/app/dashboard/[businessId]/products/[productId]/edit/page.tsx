"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
      .then((res) => res.json())
      .then((data) => {
        const found = data.find(
          (p: any) => String(p.BUSINESS_PRODUCT_ID) === String(productId)
        );
        setProduct(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setLoading(false);
      });
  }, [businessId, productId]);

  async function handleEdit(values: {
    title: string;
    description: string;
    product_price: string;
    pic: string;
    tag_ids: number[];
  }) {
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
          tag_ids: values.tag_ids,
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
    return (
      <div className="text-center text-gray-400 py-12">Loading product...</div>
    );
  }
  if (!product) {
    return (
      <div className="text-center text-red-500 py-12">Product not found.</div>
    );
  }

  return (
    <div className=" p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
         
        </div>
      </div>
      <ProductForm
        mode="edit"
        initialValues={{
          title: product.TITLE,
          description: product.DESCRIPTION,
          product_price: product.PRODUCT_PRICE,
          pic: product.PIC,
          tag_ids:
            product.tags?.map((tag: any) => tag.BUSINESS_PRODUCT_TAG_ID) || [],
        }}
        onSubmit={handleEdit}
        loading={saving}
        error={error}
      />
    </div>
  );
}
