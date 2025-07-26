"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { uploadImagesToStrapi } from "@/services/HelperFunctions";

interface CategoryFormProps {
  mode: "add" | "edit";
  initialValues?: {
    title?: string;
    description?: string;
    pic?: string;
    status?: number;
  };
  onSubmit: (values: { 
    title: string; 
    description: string; 
    pic: string;
    status: number;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function CategoryForm({ mode, initialValues, onSubmit, loading, error }: CategoryFormProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    pic: initialValues?.pic || "",
    status: initialValues?.status ?? 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (form.title.length > 45) return "Title must be at most 45 characters.";
    if (form.description.length > 255) return "Description must be at most 255 characters.";
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

    // Upload image if there's a new file
    if (imageFile) {
      await handleImageUpload();
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      pic: form.pic.trim(),
      status: form.status,
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleStatusChange(checked: boolean) {
    setForm(f => ({ ...f, status: checked ? 1 : 0 }));
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
        <Label htmlFor="title">Category Name</Label>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter category name"
          maxLength={45}
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
          placeholder="Enter category description"
          maxLength={255}
          rows={3}
          className="text-base py-3 px-4 mt-1"
        />
      </div>

      <div>
        <Label htmlFor="image">Category Image</Label>
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
                alt="Category preview"
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

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={form.status === 1}
          onCheckedChange={handleStatusChange}
        />
        <Label htmlFor="status">Active Category</Label>
      </div>

      <Button 
        type="submit" 
        className="bg-foodeez-primary text-white hover:bg-foodeez-secondary text-lg py-3 mt-2" 
        disabled={loading || uploadingImage}
      >
        {loading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Category" : "Save Changes")}
      </Button>
    </form>
  );
} 