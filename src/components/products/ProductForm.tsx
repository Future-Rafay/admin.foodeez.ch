"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductFormProps {
  mode: "add" | "edit";
  initialValues?: {
    title?: string;
    description?: string;
    product_price?: string | number;
    pic?: string;
  };
  onSubmit: (values: { title: string; description: string; product_price: string; pic: string }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function ProductForm({ mode, initialValues, onSubmit, loading, error }: ProductFormProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    product_price: initialValues?.product_price?.toString() || "",
    pic: initialValues?.pic || "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.product_price.trim() || isNaN(Number(form.product_price))) return "Valid price is required.";
    if (form.title.length > 100) return "Title must be at most 100 characters.";
    if (form.description.length > 1000) return "Description must be at most 1000 characters.";
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
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      product_price: form.product_price.trim(),
      pic: form.pic.trim(),
    });
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
        <Label htmlFor="pic">Image</Label>
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
      <Button type="submit" className="bg-foodeez-primary text-white hover:bg-foodeez-secondary text-lg py-3 mt-2" disabled={loading}>
        {loading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Product" : "Save Changes")}
      </Button>
    </form>
  );
} 