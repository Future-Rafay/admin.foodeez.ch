"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import { uploadImagesToStrapi } from "@/services/HelperFunctions";

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
    hasPendingImage?: boolean;
    pendingImageFile?: File;
  }) {
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
          tag_ids: values.tag_ids,
          hasPendingImage: values.hasPendingImage,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add product");
      }
      
      const productData = await res.json();
      
      // If there's a pending image, start background upload
      if (values.hasPendingImage && productData.BUSINESS_PRODUCT_ID && values.pendingImageFile) {
        // Start background image upload process
        handleBackgroundImageUpload(productData.BUSINESS_PRODUCT_ID, values.pendingImageFile);
      }
      
      router.push(`/dashboard/${businessId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setLoading(false);
    }
  }

  async function handleBackgroundImageUpload(productId: number, imageFile: File) {
    try {
      console.log(`Background image upload started for product ${productId}`);
      
      // Upload image to Strapi
      const urls = await uploadImagesToStrapi([imageFile]);
      if (urls.length > 0) {
        const imageUrl = urls[0];
        
        // Update the product with the new image URL
        const updateRes = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: productId,
            title: "", // We only need to update the image
            description: "",
            product_price: "",
            pic: imageUrl,
            tag_ids: [],
            updateImageOnly: true, // Flag to only update image
          }),
        });
        
        if (updateRes.ok) {
          console.log(`Image URL updated for product ${productId}: ${imageUrl}`);
        } else {
          console.error("Failed to update product with image URL");
        }
      }
    } catch (error) {
      console.error("Background image upload failed:", error);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
      <ProductForm mode="add" onSubmit={handleAdd} loading={loading} error={error} />
    </div>
  );
} 