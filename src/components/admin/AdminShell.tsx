"use client";

import { ReactNode, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileDrawer from "@/components/admin/AdminMobileDrawer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useSetBusinessId } from "@/components/providers/BusinessProvider";
import { getBusinessDetail } from "@/services/HelperFunctions";

interface AdminShellProps {
  businessId: string;
  restaurantName?: string;
  children: ReactNode;
}

export default function AdminShell({
  businessId,
  restaurantName,
  children,
}: AdminShellProps) {
  const setBusinessId = useSetBusinessId();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [resolvedRestaurantName, setResolvedRestaurantName] = useState(
    restaurantName
  );

  useEffect(() => {
    setBusinessId(businessId);
  }, [businessId, setBusinessId]);

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurantName() {
      if (restaurantName) {
        setResolvedRestaurantName(restaurantName);
        return;
      }

      const numericBusinessId = Number(businessId);
      if (!Number.isFinite(numericBusinessId)) return;

      try {
        const businessDetails = await getBusinessDetail(numericBusinessId);
        const business = businessDetails?.[0];
        if (isMounted) {
          setResolvedRestaurantName(
            business?.BUSINESS_NAME || business?.SHORT_NAME || undefined
          );
        }
      } catch (error) {
        console.error("Failed to load admin shell business details:", error);
      }
    }

    loadRestaurantName();

    return () => {
      isMounted = false;
    };
  }, [businessId, restaurantName]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-20 lg:w-60">
        <AdminSidebar
          businessId={businessId}
          restaurantName={resolvedRestaurantName}
        />
      </div>

      <div className="min-h-screen md:pl-20 lg:pl-60">
        <AdminHeader
          businessId={businessId}
          mobileNavigation={
            <AdminMobileDrawer
              businessId={businessId}
              restaurantName={resolvedRestaurantName}
              isOpen={isMobileNavOpen}
              onOpenChange={setIsMobileNavOpen}
            />
          }
        />
        <main className="min-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
