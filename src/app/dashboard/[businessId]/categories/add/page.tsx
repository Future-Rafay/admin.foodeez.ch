"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "@/components/products/CategoryForm";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import { uploadImagesToStrapi } from "@/services/HelperFunctions";

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
    hasPendingImage?: boolean;
    pendingImageFile?: File;
  }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: Number(businessId),
          title: values.title,
          description: values.description,
          pic: values.pic,
          status: values.status,
          tag_ids: values.tag_ids,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add category");
      }
      
      const categoryData = await res.json();
      
      // If there's a pending image, start background upload
      if (values.hasPendingImage && categoryData.BUSINESS_PRODUCT_CATEGORY_ID && values.pendingImageFile) {
        handleBackgroundImageUpload(categoryData.BUSINESS_PRODUCT_CATEGORY_ID, values.pendingImageFile);
      }
      
      router.push(`/dashboard/${businessId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setLoading(false);
    }
  }

  async function handleBackgroundImageUpload(categoryId: number, imageFile: File) {
    try {
      console.log(`Background image upload started for category ${categoryId}`);
      
      // Upload image to Strapi
      const urls = await uploadImagesToStrapi([imageFile]);
      if (urls.length > 0) {
        const imageUrl = urls[0];
        
        // Update the category with the new image URL
        const updateRes = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: categoryId,
            title: "", // We only need to update the image
            description: "",
            pic: imageUrl,
            status: 1,
            tag_ids: [],
            updateImageOnly: true, // Flag to only update image
          }),
        });
        
        if (updateRes.ok) {
          console.log(`Image URL updated for category ${categoryId}: ${imageUrl}`);
        } else {
          console.error("Failed to update category with image URL");
        }
      }
    } catch (error) {
      console.error("Background image upload failed:", error);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add Category</h1>
      <CategoryForm mode="add" onSubmit={handleAdd} loading={loading} error={error} />
    </div>
  );
} 