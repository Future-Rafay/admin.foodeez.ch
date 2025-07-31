"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { business_product_tag } from "@prisma/client";
import { useBusinessId } from "@/components/providers/BusinessProvider";

interface TagFormData {
  title: string;
}

export default function TagsTable() {
  const router = useRouter();
  const businessId = useBusinessId();

  const [tags, setTags] = useState<business_product_tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<business_product_tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>({ title: "" });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    loadTags();
  }, [businessId]);

  async function loadTags() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tags?businessId=${businessId}`);
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setFormData({ title: "" });
    setIsAddDialogOpen(true);
  }

  function handleEdit(tag: business_product_tag) {
    setEditingTag(tag);
    setFormData({ title: tag.TITLE || "" });
    setIsEditDialogOpen(true);
  }

  function handleDelete(id: number) {
    setDeleteId(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingTag ? "PUT" : "POST";
      const url = "/api/tags";
      const body = {
        ...(editingTag && { id: editingTag.BUSINESS_PRODUCT_TAG_ID }),
        businessId: Number(businessId),
        title: formData.title,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save tag");

      const savedTag = await res.json();
      
      if (editingTag) {
        setTags(tags => tags.map(t => 
          t.BUSINESS_PRODUCT_TAG_ID === savedTag.BUSINESS_PRODUCT_TAG_ID ? savedTag : t
        ));
      } else {
        setTags(tags => [...tags, savedTag]);
      }

      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingTag(null);
      setFormData({ title: "" });
    } catch (error) {
      console.error("Failed to save tag:", error);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteConfirmed(id: number) {
    setDeleting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete tag");
      setTags(tags => tags.filter(t => t.BUSINESS_PRODUCT_TAG_ID !== id));
    } catch (error) {
      console.error("Failed to delete tag:", error);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading...</div>;
  }

  return (
    <div className="rounded shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-2xl font-semibold">Tags</h2>
        <Button className="bg-foodeez-primary text-white hover:bg-foodeez-secondary" onClick={handleAdd}>
          + Add Tag
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableCaption>Manage your product and category tags here.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-400 py-8">
                  No tags found. Start by adding your first tag!
                </TableCell>
              </TableRow>
            ) : (
              tags.map(tag => (
                <TableRow key={tag.BUSINESS_PRODUCT_TAG_ID}>
                  <TableCell className="font-medium">{tag.TITLE}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(tag)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(tag.BUSINESS_PRODUCT_TAG_ID)}>
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
        {tags.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No tags found. Start by adding your first tag!
          </div>
        ) : (
          tags.map(tag => (
            <Card key={tag.BUSINESS_PRODUCT_TAG_ID} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{tag.TITLE}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tag)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tag.BUSINESS_PRODUCT_TAG_ID)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={() => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingTag(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add New Tag"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Tag Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter tag name"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : (editingTag ? "Save Changes" : "Add Tag")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This will remove it from all associated products and categories.
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