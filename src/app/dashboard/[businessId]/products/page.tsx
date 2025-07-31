"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductTable from '@/components/products/ProductTable';
import CategoryTable from '@/components/products/CategoryTable';
import TagsTable from '@/components/products/TagsTable';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar for tabs - hidden on mobile, shown on desktop */}
            <div className="hidden lg:block lg:w-64">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-white shadow-sm rounded-lg p-2">
                <TabsTrigger
                  value="products"
                  className="w-full justify-start px-4 py-3 text-left data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="font-medium">Products</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="w-full justify-start px-4 py-3 text-left data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-medium">Categories</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="w-full justify-start px-4 py-3 text-left data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-medium">Tags</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile tabs - shown on mobile, hidden on desktop */}
            <div className="lg:hidden w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm rounded-lg p-1">
                <TabsTrigger
                  value="products"
                  className="px-4 py-2 text-sm data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  Products
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="px-4 py-2 text-sm data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  Categories
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="px-4 py-2 text-sm data-[state=active]:bg-foodeez-primary data-[state=active]:text-white rounded-md transition-all"
                >
                  Tags
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content area */}
            <div className="flex-1">
              <TabsContent value="products" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border">
                  <ProductTable />
                </div>
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border">
                  <CategoryTable />
                </div>
              </TabsContent>

              <TabsContent value="tags" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm border">
                  <TagsTable />
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 