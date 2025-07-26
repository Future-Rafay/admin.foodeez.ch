"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { business_product_category } from "@prisma/client";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function CategoryTable() {
  const router = useRouter();
  const businessId = useBusinessId();

  const [categories, setCategories] = useState<business_product_category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`/api/categories?businessId=${businessId}`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, [businessId]);

  function handleAdd() {
    router.push(`/dashboard/${businessId}/categories/add`);
  }

  function handleEdit(id: number) {
    router.push(`/dashboard/${businessId}/categories/${id}/edit`);
  }

  function handleDelete(id: number) {
    setDeleteId(id);
  }

  async function onDeleteConfirmed(id: number) {
    setDeleting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete category");
      }
      setCategories(c => c.filter(cat => cat.BUSINESS_PRODUCT_CATEGORY_ID !== id));
    } catch (err) {
      console.error("Failed to delete category:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="rounded shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Button className="bg-foodeez-primary text-white hover:bg-foodeez-secondary" onClick={handleAdd}>
          + Add Category
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableCaption>Manage your product categories here.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No categories found. Start by adding your first category!
                </TableCell>
              </TableRow>
            ) : (
              categories.map(category => (
                <TableRow key={category.BUSINESS_PRODUCT_CATEGORY_ID}>
                  <TableCell className="font-medium">{category.TITLE}</TableCell>
                  <TableCell className="max-w-xs truncate">{category.DESCRIPTION}</TableCell>
                  <TableCell>
                    {category.PIC ? (
                      <Avatar>
                        <AvatarImage src={category.PIC} alt={category.TITLE || 'Category'} />
                        <AvatarFallback>{category.TITLE?.[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-gray-300">No image</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.STATUS === 1 ? "default" : "secondary"}>
                      {category.STATUS === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category.BUSINESS_PRODUCT_CATEGORY_ID)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(category.BUSINESS_PRODUCT_CATEGORY_ID)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {categories.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No categories found. Start by adding your first category!
          </div>
        ) : (
          categories.map(category => (
            <Card key={category.BUSINESS_PRODUCT_CATEGORY_ID} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{category.TITLE}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={category.STATUS === 1 ? "default" : "secondary"} className="text-xs">
                        {category.STATUS === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  {category.PIC && (
                    <Avatar className="w-16 h-16 ml-3 flex-shrink-0">
                      <AvatarImage src={category.PIC} alt={category.TITLE || 'Category'} />
                      <AvatarFallback>{category.TITLE?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {category.DESCRIPTION && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.DESCRIPTION}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(category.BUSINESS_PRODUCT_CATEGORY_ID)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(category.BUSINESS_PRODUCT_CATEGORY_ID)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteId && onDeleteConfirmed(deleteId)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 