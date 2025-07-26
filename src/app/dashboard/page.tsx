"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessIds, getBusinessOwner, getBusinessesDetails } from "@/services/HelperFunctions";
import { business_owner, business_owner_2_business, business_detail_view_all } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/core/DashboardNavbar";
import DashboardFooter from "@/components/core/DashboardFooter";
import { useRouter } from "next/navigation";
import { BusinessProvider, useSetBusinessId } from "@/components/providers/BusinessProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Types
type BusinessWithDetails = business_owner_2_business & {
  details?: business_detail_view_all | null;
};

// Loading State Component
function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 w-full">
      <section className="w-full max-w-3xl mx-auto text-center mb-10">
        <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </section>
      <div className="w-full max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error Message Component
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-4">
      <h1 className="text-3xl font-bold text-destructive">Error</h1>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

// Not Registered Message Component
function NotRegisteredMessage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-4">
      <h1 className="text-3xl font-bold text-primary">Not Registered as Business Owner</h1>
      <p className="text-muted-foreground max-w-md">
        You need to register as a business owner on Foodeez to access the admin dashboard.
        Please contact support or register your business to continue.
      </p>
    </div>
  );
}

// No Businesses Message Component
function NoBusinessesMessage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-4">
      <h1 className="text-3xl font-bold text-primary">No Businesses Found</h1>
      <p className="text-muted-foreground max-w-md">
        You don't have any businesses associated with your business owner account yet.
        Please add a business or contact support for assistance.
      </p>
    </div>
  );
}

// Business Card Component
function BusinessCard({ business }: { business: BusinessWithDetails }) {
  const router = useRouter();
  const setBusinessId = useSetBusinessId();

  const handleBusinessSelect = () => {
    setBusinessId(business.BUSINESS_ID?.toString() || "");
    router.push(`/dashboard/${business.BUSINESS_ID}`);
  };

  return (
    <Card 
      onClick={handleBusinessSelect}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 group"
    >
      <CardHeader className="relative pb-2">
        {business.details?.LOGO && (
          <div className="absolute right-4 top-4 w-12 h-12 rounded-full overflow-hidden border-2 border-muted">
            <Image
              src={business.details.LOGO}
              alt={business.details.BUSINESS_NAME || "Business logo"}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        )}
        <CardTitle className="line-clamp-2 pr-16">
          {business.details?.BUSINESS_NAME || `Business #${business.BUSINESS_ID}`}
        </CardTitle>
        {business.details?.SHORT_NAME && (
          <p className="text-sm text-muted-foreground">
            {business.details.SHORT_NAME}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {business.details?.VEGAN === 1 && (
              <Badge variant="outline" className="bg-green-50">Vegan</Badge>
            )}
            {business.details?.VEGETARIAN === 1 && (
              <Badge variant="outline" className="bg-green-50">Vegetarian</Badge>
            )}
            {business.details?.HALAL === 1 && (
              <Badge variant="outline" className="bg-blue-50">Halal</Badge>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            {business.details?.ADDRESS_TOWN && (
              <p className="text-muted-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {business.details.ADDRESS_TOWN}
              </p>
            )}
            {business.details?.HAVING_ACTIVE_MENU_CARD === 1 && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                Active Menu
              </Badge>
            )}
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Click to manage →
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Business List Component
function BusinessList({ businesses }: { businesses: BusinessWithDetails[] }) {
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 w-full">
      <section className="w-full max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Welcome to Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a business to manage your menu, orders, and more.
        </p>
      </section>
      <div className="w-full max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <BusinessCard key={business.BUSINESS_OWNER_2_BUSINESS_ID} business={business} />
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Content Component
function DashboardContent() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<BusinessWithDetails[]>([]);
  const [owner, setOwner] = useState<business_owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // First check if user is a business owner
        const ownerData = await getBusinessOwner(Number(session.user.id));
        setOwner(ownerData);

        if (!ownerData) {
          setIsLoading(false);
          return;
        }

        // Then get their businesses with details
        const businessesData = await getBusinessIds(ownerData.BUSINESS_OWNER_ID);
        
        // Get details for each business
        const businessesWithDetails = await Promise.all(
          businessesData.map(async (business) => {
            const details = await getBusinessesDetails(Number(business.BUSINESS_ID));
            return {
              ...business,
              details: details[0] || null
            };
          })
        );

        setBusinesses(businessesWithDetails);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!owner) {
    return <NotRegisteredMessage />;
  }

  if (!businesses?.length) {
    return <NoBusinessesMessage />;
  }

  return <BusinessList businesses={businesses} />;
}

// Main Dashboard Page Component
export default function DashboardRootPage() {
  return (
    <BusinessProvider>
      <div className="min-h-screen flex flex-col">
        <DashboardNavbar />
        <DashboardContent />
        <DashboardFooter />
      </div>
    </BusinessProvider>
  );
}
