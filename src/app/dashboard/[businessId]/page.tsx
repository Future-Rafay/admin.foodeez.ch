"use client";

import { useBusinessId } from "@/components/ui/providers/BusinessProvider";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
    const businessId = useBusinessId();
 
    
  const summary = {
    products: 0, // Placeholder, fetch real count later
    orders: 0,
    // Add more as needed
  };

  return (
    <div className="flex flex-col min-h-screen">
     
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Products Summary Card */}
          <Link href={`/dashboard/${businessId}/products`} className="group block rounded-lg shadow bg-white p-6 border border-foodeez-primary/20 hover:border-foodeez-primary transition">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-foodeez-primary/10 p-3">
                <Image src="/images/Logo/LogoFoodeezMain.svg" alt="Products" width={32} height={32} />
              </div>
              <div>
                <div className="text-lg font-semibold text-foodeez-primary group-hover:underline">Products</div>
                <div className="text-gray-500 text-sm">Manage your menu items</div>
                <div className="mt-2 text-2xl font-bold text-foodeez-primary">{summary.products}</div>
              </div>
            </div>
          </Link>
          {/* Orders Summary Card (example, not implemented) */}
          <div className="block rounded-lg shadow bg-white p-6 border border-gray-200 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gray-200 p-3">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-400">Orders</div>
                <div className="text-gray-400 text-sm">Coming soon</div>
                <div className="mt-2 text-2xl font-bold text-gray-300">{summary.orders}</div>
              </div>
            </div>
          </div>
          {/* Add more summary cards as needed */}
        </div>
      </main>
     
    </div>
  );
} 