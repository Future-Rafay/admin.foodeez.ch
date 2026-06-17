"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { uploadImagesToS3 } from "@/lib/media-upload";
import TagSelect from "./TagSelect";

interface CategoryFormProps {
  mode: "add" | "edit";
  initialValues?: {
    title?: string;
    description?: string;
    pic?: string;
    status?: number;
    tag_ids?: number[];
  };
  onSubmit: (values: {
    title: string;
    description: string;
    pic: string;
    status: number;
    tag_ids: number[];
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function CategoryForm({
  mode,
  initialValues,
  onSubmit,
  loading,
  error,
}: CategoryFormProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    pic: initialValues?.pic || "",
    status: initialValues?.status ?? 1,
    tag_ids: initialValues?.tag_ids || [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (form.title.length > 45) return "Title must be at most 45 characters.";
    if (form.description.length > 255)
      return "Description must be at most 255 characters.";
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
          setFormError("Failed to upload image.");
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
      pic: picUrl,
      status: form.status,
      tag_ids: form.tag_ids,
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleStatusChange(checked: boolean) {
    setForm((f) => ({ ...f, status: checked ? 1 : 0 }));
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
          <CardTitle className="text-lg">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
              placeholder="Enter category description"
              maxLength={255}
              rows={3}
              disabled={isBusy}
              className="text-base py-3 px-4 mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={form.status === 1}
              onCheckedChange={handleStatusChange}
              disabled={isBusy}
            />
            <Label htmlFor="status">Active Category</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Image</CardTitle>
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
              ? "Add Category"
              : "Save Changes"}
      </Button>
    </form>
  );
}
