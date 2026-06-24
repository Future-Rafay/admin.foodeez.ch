"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { uploadImagesToS3 } from "@/lib/media-upload";
import TagSelect from "./TagSelect";
import { ProductCategoryOption } from "@/services/admin-data";

interface ProductFormProps {
  mode: "add" | "edit";
  initialValues?: {
    title?: string;
    description?: string;
    product_price?: string | number;
    pic?: string;
    tag_ids?: number[];
    categoryId?: number | null;
  };
  onSubmit: (values: {
    title: string;
    description: string;
    product_price: string;
    pic: string;
    tag_ids: number[];
    categoryId: number | null;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
  categoryOptions?: ProductCategoryOption[];
}

export default function ProductForm({
  mode,
  initialValues,
  onSubmit,
  loading,
  error,
  categoryOptions = [],
}: ProductFormProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    product_price: initialValues?.product_price?.toString() || "",
    pic: initialValues?.pic || "",
    tag_ids: initialValues?.tag_ids || [],
    categoryId: initialValues?.categoryId?.toString() || "none",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.product_price.trim() || isNaN(Number(form.product_price)))
      return "Valid price is required.";
    if (form.title.length > 100) return "Title must be at most 100 characters.";
    if (form.description.length > 1000)
      return "Description must be at most 1000 characters.";
    if (form.pic.length > 255) return "Image URL must be at most 255 characters.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    let picUrl = form.pic.trim();

    if (imageFile) {
      setUploadingImage(true);
      try {
        const urls = await uploadImagesToS3([imageFile]);
        if (!urls.length) {
          setFormError("Failed to upload image to S3.");
          return;
        }
        picUrl = urls[0];
      } catch {
        setFormError("Failed to upload image. Please try again.");
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      product_price: form.product_price.trim(),
      pic: picUrl,
      tag_ids: form.tag_ids,
      categoryId: form.categoryId === "none" ? null : Number(form.categoryId),
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const isBusy = loading || uploadingImage;

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
              disabled={isBusy}
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
              disabled={isBusy}
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
              disabled={isBusy}
              className="text-lg py-3 px-4 mt-1"
            />
          </div>

          {categoryOptions.length > 0 && (
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, categoryId: value }))
                }
                disabled={isBusy}
              >
                <SelectTrigger id="category" className="mt-1 h-11 w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-gray-500">
                Products inherit category membership through the category tags.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploadField
            value={form.pic}
            onChange={(url) => setForm((f) => ({ ...f, pic: url }))}
            onFileSelect={setImageFile}
            imageFile={imageFile}
            previewUrl={imagePreview}
            onPreviewChange={setImagePreview}
            disabled={isBusy}
            uploading={uploadingImage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagSelect
            selectedTags={form.tag_ids}
            onTagsChange={(tagIds) =>
              setForm((f) => ({ ...f, tag_ids: tagIds }))
            }
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="bg-foodeez-primary text-white hover:bg-foodeez-secondary text-lg py-3"
        disabled={isBusy}
      >
        {uploadingImage
          ? "Uploading image..."
          : loading
            ? mode === "add"
              ? "Adding..."
              : "Saving..."
            : mode === "add"
              ? "Add Product"
              : "Save Changes"}
      </Button>
    </form>
  );
}
