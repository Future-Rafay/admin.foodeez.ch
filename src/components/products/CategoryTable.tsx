"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { business_product_category, business_product_tag } from "@prisma/client";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import TagFilter from "./TagFilter";

interface CategoryWithTags extends business_product_category {
  tags?: business_product_tag[];
}

export default function CategoryTable() {
  const router = useRouter();
  const businessId = useBusinessId();

  const [categories, setCategories] = useState<CategoryWithTags[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`/api/categories?businessId=${businessId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Loaded categories with tags:', data);
        setCategories(data);
        setFilteredCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, [businessId]);

  // Filter categories when tags are selected
  useEffect(() => {
    console.log('Filtering categories:', { selectedTags, categoriesCount: categories.length });
    if (selectedTags.length === 0) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => {
        const categoryTags = category.tags?.map(tag => tag.BUSINESS_PRODUCT_TAG_ID) || [];
        console.log(`Category ${category.TITLE}:`, { categoryTags, selectedTags });
        return selectedTags.every(tagId => categoryTags.includes(tagId));
      });
      console.log('Filtered categories:', filtered.length);
      setFilteredCategories(filtered);
    }
  }, [selectedTags, categories]);

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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Organize your products with categories and tags
            </p>
          </div>
          <Button 
            className="bg-foodeez-primary text-white hover:bg-foodeez-secondary shadow-sm" 
            onClick={handleAdd}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </Button>
        </div>

        <div className="mt-6">
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            className="pb-2"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableCaption className="text-sm text-gray-500">
            {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} found
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name & Tags</TableHead>
              <TableHead className="font-semibold text-gray-700">Description</TableHead>
              <TableHead className="font-semibold text-gray-700">Image</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No categories found. Start by adding your first category!
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map(category => (
                <TableRow key={category.BUSINESS_PRODUCT_CATEGORY_ID} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{category.TITLE}</div>
                      {category.tags && category.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {category.tags.slice(0, 2).map(tag => (
                            <Badge key={tag.BUSINESS_PRODUCT_TAG_ID} variant="outline" className="text-xs">
                              {tag.TITLE}
                            </Badge>
                          ))}
                          {category.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{category.DESCRIPTION}</div>
                  </TableCell>
                  <TableCell>
                    {category.PIC ? (
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-gray-100 shadow-sm">
                          <AvatarImage 
                            src={category.PIC} 
                            alt={category.TITLE || 'Category'}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                            {category.TITLE?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.STATUS === 1 ? "default" : "secondary"}>
                      {category.STATUS === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(category.BUSINESS_PRODUCT_CATEGORY_ID)}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(category.BUSINESS_PRODUCT_CATEGORY_ID)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No categories found. Start by adding your first category!
          </div>
        ) : (
          filteredCategories.map(category => (
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
                  {category.PIC ? (
                    <Avatar className="w-16 h-16 ml-3 flex-shrink-0 border-2 border-gray-100 shadow-sm">
                      <AvatarImage 
                        src={category.PIC} 
                        alt={category.TITLE || 'Category'}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                        {category.TITLE?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-16 h-16 ml-3 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
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