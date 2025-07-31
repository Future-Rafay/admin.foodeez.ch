"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import { uploadImagesToStrapi } from "@/services/HelperFunctions";
import TagSelect from "./TagSelect";

interface ProductFormProps {
  mode: "add" | "edit";
  initialValues?: {
    title?: string;
    description?: string;
    product_price?: string | number;
    pic?: string;
    tag_ids?: number[];
  };
  onSubmit: (values: { 
    title: string; 
    description: string; 
    product_price: string; 
    pic: string;
    tag_ids: number[];
    hasPendingImage?: boolean;
    pendingImageFile?: File;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function ProductForm({ mode, initialValues, onSubmit, loading, error }: ProductFormProps) {
  const businessId = useBusinessId();
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    product_price: initialValues?.product_price?.toString() || "",
    pic: initialValues?.pic || "",
    tag_ids: initialValues?.tag_ids || [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);



  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.product_price.trim() || isNaN(Number(form.product_price))) return "Valid price is required.";
    if (form.title.length > 100) return "Title must be at most 100 characters.";
    if (form.description.length > 1000) return "Description must be at most 1000 characters.";
    if (form.pic.length > 255) return "Image URL must be at most 255 characters.";
    return null;
  }

  async function handleImageUpload() {
    if (!imageFile) return;
    
    setUploadingImage(true);
    try {
      const urls = await uploadImagesToStrapi([imageFile]);
      if (urls.length > 0) {
        setForm(prev => ({ ...prev, pic: urls[0] }));
        setImagePreview(urls[0]);
      }
    } catch (error) {
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    // Submit form data immediately (without waiting for image upload)
    const hasNewImage = !!imageFile;
    const currentPicUrl = form.pic.trim();
    
          // If there's a new image, we'll upload it in background
      if (hasNewImage) {
        // Submit with current pic URL (or empty), image will be updated later
        await onSubmit({
          title: form.title.trim(),
          description: form.description.trim(),
          product_price: form.product_price.trim(),
          pic: currentPicUrl, // Use current URL, will be updated after Strapi upload
          tag_ids: form.tag_ids,
          hasPendingImage: true, // Flag to indicate background image upload needed
          pendingImageFile: imageFile, // Pass the file for background upload
        });
      } else {
        // No new image, submit normally
        await onSubmit({
          title: form.title.trim(),
          description: form.description.trim(),
          product_price: form.product_price.trim(),
          pic: currentPicUrl,
          tag_ids: form.tag_ids,
          hasPendingImage: false,
        });
      }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }



  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="title">Product Name</Label>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter product name"
          maxLength={100}
          required
          className="text-lg py-3 px-4 mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter product description"
          maxLength={1000}
          rows={5}
          className="text-base py-3 px-4 mt-1"
        />
      </div>

      <div>
        <Label htmlFor="product_price">Price (CHF)</Label>
        <Input
          id="product_price"
          name="product_price"
          type="number"
          min="0"
          step="0.01"
          value={form.product_price}
          onChange={handleChange}
          placeholder="e.g. 16.50"
          required
          className="text-lg py-3 px-4 mt-1"
        />
      </div>



      <div>
        <Label htmlFor="image">Product Image</Label>
        <div className="space-y-4 mt-1">
          {/* Image upload */}
          <div className="flex flex-col gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-base py-3 px-4"
            />
            {imageFile && (
              <Button 
                type="button" 
                onClick={handleImageUpload}
                disabled={uploadingImage}
                variant="outline"
                className="w-fit"
              >
                {uploadingImage ? "Uploading..." : "Upload Image"}
              </Button>
            )}
          </div>

          {/* Image preview */}
          {(imagePreview || form.pic) && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <img
                src={imagePreview || form.pic}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Manual URL input */}
          <div>
            <Label htmlFor="pic">Or paste image URL</Label>
            <Input
              id="pic"
              name="pic"
              value={form.pic}
              onChange={handleChange}
              placeholder="Paste image URL or leave blank"
              maxLength={255}
              className="text-base py-3 px-4 mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="mt-1">
          <TagSelect
            selectedTags={form.tag_ids}
            onTagsChange={(tagIds) => setForm(f => ({ ...f, tag_ids: tagIds }))}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="bg-foodeez-primary text-white hover:bg-foodeez-secondary text-lg py-3 mt-2" 
        disabled={loading || uploadingImage}
      >
        {loading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Product" : "Save Changes")}
      </Button>
    </form>
  );
} 