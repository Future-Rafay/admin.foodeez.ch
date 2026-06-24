"use client";

import { useEffect } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AdminBusinessIdentity } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

interface AdminMobileDrawerProps {
  businessId: string;
  restaurantName?: string;
  business?: AdminBusinessIdentity | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminMobileDrawer({
  businessId,
  restaurantName,
  business,
  isOpen,
  onOpenChange,
}: AdminMobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange]);

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 md:hidden"
        aria-label="Open admin navigation"
        aria-expanded={isOpen}
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden", // FIXED: Mobile sidebar layout
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity", // FIXED: Mobile sidebar layout
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => onOpenChange(false)}
          aria-label="Close admin navigation"
        />
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-2xl transition-transform duration-200 ease-out", // FIXED: Mobile sidebar layout
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close admin navigation"
          >
            <X className="size-5" />
          </button>
          <AdminSidebar
            businessId={businessId}
            restaurantName={restaurantName}
            business={business}
            onNavigate={() => onOpenChange(false)}
            collapseOnMedium={false}
            className="h-screen w-full bg-white" // FIXED: Mobile sidebar layout
          />
        </div>
      </div>
    </>
  );
}
