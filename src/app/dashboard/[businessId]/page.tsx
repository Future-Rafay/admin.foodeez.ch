"use client";

import { useBusinessId } from "@/components/providers/BusinessProvider";
import { getBusinessDetail, getBusinessOrders, getBusinessProducts } from "@/services/HelperFunctions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, Receipt, Building2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { serializeData } from "@/lib/utils";
import { BusinessInfoCard } from "@/components/dashboard/BusinessInfoCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { business_detail_view_all, business_order, business_product } from "@prisma/client";

interface DashboardData {
  products: business_product[];
  orders: business_order[];
  business: business_detail_view_all | null;
}

export default function DashboardPage() {
  const businessId = useBusinessId();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    products: [],
    orders: [],
    business: null
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!businessId) return;

      try {
        setIsLoading(true);
        setError(null);

        const [products, orders, businessDetails] = await Promise.all([
          getBusinessProducts(Number(businessId)),
          getBusinessOrders(Number(businessId)),
          getBusinessDetail(Number(businessId))
        ]);

        // Serialize the data to handle Decimal values
        setData({
          products: serializeData(products),
          orders: serializeData(orders),
          business: businessDetails ? serializeData(businessDetails[0]) : null
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [businessId]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  if (!data.business) {
    return <DashboardError error="Business not found" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 sm:p-6 space-y-8 w-full">
        {/* Business Info */}
        <BusinessInfoCard business={data.business} />

        {/* Stats Cards */}
        <section className="grid gap-6">
          <h2 className="text-2xl font-bold text-foodeez-primary">Dashboard Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Products"
              value={data.products.length}
              description="Active menu items"
              icon={Package}
              href={`/dashboard/${businessId}/products`}
            />
            <ComingSoonCard title="Orders" icon={Receipt} />
            <ComingSoonCard title="Settings" icon={Building2} />
          </div>
        </section>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-8 max-w-7xl mx-auto w-full">
      <Card>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 space-y-4">
              <Skeleton className="h-32 w-32 rounded-xl" />
              <Skeleton className="h-32 w-32 rounded-xl" />
            </div>
            <div className="flex-grow space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error }: { error: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ComingSoonCard({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <Card className="border-dashed border-muted-foreground/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted p-3">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold text-muted-foreground">
              {title}
            </div>
            <div className="text-sm text-muted-foreground/60">Coming Soon</div>
            <div className="mt-2 flex items-center text-sm text-muted-foreground/60">
              <Clock className="w-4 h-4 mr-1" /> In Development
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}