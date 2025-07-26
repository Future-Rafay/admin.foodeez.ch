"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteProductModal from "./DeleteProductModal";
import { business_product, business_product_category } from "@prisma/client";
import { useBusinessId } from "@/components/providers/BusinessProvider";
import { getBusinessProducts } from "@/services/HelperFunctions";

export type SerializedProduct = Omit<business_product, 'COST_PRICE' | 'PRODUCT_PRICE' | 'COMPARE_AS_PRICE'> & {
  COST_PRICE?: number | null;
  PRODUCT_PRICE: number;
  COMPARE_AS_PRICE?: number | null;
};

interface ProductWithCategory extends SerializedProduct {
  category?: business_product_category;
}

export default function ProductTable() {
  const router = useRouter();
  const businessId = useBusinessId();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    const getProducts = async () => {
      const products = await getBusinessProducts(Number(businessId));
      setProducts(products);
    }
    getProducts();
    setLoading(false);
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

  function onDeleteConfirmed(id: number) {
    setProducts(p => p.filter(prod => prod.BUSINESS_PRODUCT_ID !== id));
    setDeleteId(null);
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading...</div>;
  }

  return (
    <div className="rounded shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-2xl font-semibold">Products</h2>
        <Button className="bg-foodeez-primary text-white hover:bg-foodeez-secondary" onClick={handleAdd}>
          + Add Product
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableCaption>Manage your products here.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No products found. Start by adding your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.BUSINESS_PRODUCT_ID}>
                  <TableCell className="font-medium">{product.TITLE}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category.TITLE}</Badge>
                    ) : (
                      <span className="text-gray-400">No category</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{product.DESCRIPTION}</TableCell>
                  <TableCell>CHF {product.PRODUCT_PRICE.toString()}</TableCell>
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {products.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No products found. Start by adding your first product!
          </div>
        ) : (
          products.map(product => (
            <Card key={product.BUSINESS_PRODUCT_ID} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{product.TITLE}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {product.category ? (
                        <Badge variant="secondary" className="text-xs">{product.category.TITLE}</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No category</span>
                      )}
                      <span className="text-lg font-semibold text-foodeez-primary">
                        CHF {product.PRODUCT_PRICE.toString()}
                      </span>
                    </div>
                  </div>
                  {product.PIC && (
                    <Avatar className="w-16 h-16 ml-3 flex-shrink-0">
                      <AvatarImage src={product.PIC} alt={product.TITLE} />
                      <AvatarFallback>{product.TITLE?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {product.DESCRIPTION && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.DESCRIPTION}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product.BUSINESS_PRODUCT_ID)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.BUSINESS_PRODUCT_ID)}
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