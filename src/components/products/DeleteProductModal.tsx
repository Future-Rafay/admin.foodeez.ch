"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProductModalProps {
  productId: number;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export default function DeleteProductModal({ productId, onClose, onDeleted }: DeleteProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete product");
      }
      onDeleted(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-lg font-medium mb-2">Are you sure you want to delete this product?</p>
          <p className="text-muted-foreground mb-4">This action cannot be undone.</p>
          {error && <div className="text-red-500 mb-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Yes, Delete"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 