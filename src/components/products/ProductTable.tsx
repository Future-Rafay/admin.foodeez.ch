"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DeleteProductModal from "./DeleteProductModal";
import { business_product } from "@prisma/client";
import { useBusinessId } from "@/components/providers/BusinessProvider";

export default function ProductTable() {
  const router = useRouter();
  const businessId = useBusinessId();

  const [products, setProducts] = useState<business_product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`/api/products?businessId=${businessId}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setLoading(false);
      });
  }, [businessId]);

  function handleAdd() {
    router.push(`/dashboard/${businessId}/products/add`);
  }

  function handleEdit(id: number) {
    router.push(`/dashboard/${businessId}/products/${id}/edit`);
  }

  function handleDelete(id: number) {
    setDeleteId(id);
  }

  function onDeleteConfirmed(id : number ) {
    setProducts(p => p.filter(prod => prod.BUSINESS_PRODUCT_ID !== id));
    setDeleteId(null);
  }

  return (
    <div className=" rounded shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-2xl font-semibold">Products</h2>
        <Button className="bg-foodeez-primary text-white hover:bg-foodeez-secondary" onClick={handleAdd}>
          + Add Product
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <Table>
          <TableCaption>Manage your products here.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No products found. Start by adding your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.BUSINESS_PRODUCT_ID}>
                  <TableCell>{product.TITLE}</TableCell>
                  <TableCell className="max-w-xs truncate">{product.DESCRIPTION}</TableCell>
                  <TableCell>{product.PRODUCT_PRICE.toString()}</TableCell>
                  <TableCell>
                    {product.PIC ? (
                      <Avatar>
                        <AvatarImage src={product.PIC} alt={product.TITLE} />
                        <AvatarFallback>{product.TITLE?.[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-gray-300">No image</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product.BUSINESS_PRODUCT_ID)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.BUSINESS_PRODUCT_ID)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      {deleteId && (
        <DeleteProductModal
          productId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={onDeleteConfirmed}
        />
      )}
    </div>
  );
} 