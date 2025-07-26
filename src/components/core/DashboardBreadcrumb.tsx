"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, Package, Tag, Plus, Edit, Settings, BarChart3, Users, ShoppingCart } from "lucide-react";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function DashboardBreadcrumb() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-4 h-4" />
    });

    if (segments.length === 0) return breadcrumbs;

    // Handle business ID segment
    if (segments[0] === "dashboard" && segments[1]) {
      breadcrumbs.push({
        label: `Business ${segments[1]}`,
        href: `/dashboard/${segments[1]}`,
      });
    }

    // Handle different sections
    if (segments[2] === "products") {
      breadcrumbs.push({
        label: "Products",
        href: `/dashboard/${segments[1]}/products`,
        icon: <Package className="w-4 h-4" />
      });

      // Handle product sub-routes
      if (segments[3] === "add") {
        breadcrumbs.push({
          label: "Add Product",
          icon: <Plus className="w-4 h-4" />
        });
      } else if (segments[3] && segments[4] === "edit") {
        breadcrumbs.push({
          label: "Edit Product",
          icon: <Edit className="w-4 h-4" />
        });
      }
    } else if (segments[2] === "categories") {
      breadcrumbs.push({
        label: "Categories",
        href: `/dashboard/${segments[1]}/products`,
        icon: <Tag className="w-4 h-4" />
      });

      // Handle category sub-routes
      if (segments[3] === "add") {
        breadcrumbs.push({
          label: "Add Category",
          icon: <Plus className="w-4 h-4" />
        });
      } else if (segments[3] && segments[4] === "edit") {
        breadcrumbs.push({
          label: "Edit Category",
          icon: <Edit className="w-4 h-4" />
        });
      }
    } else if (segments[2] === "orders") {
      breadcrumbs.push({
        label: "Orders",
        href: `/dashboard/${segments[1]}/orders`,
        icon: <ShoppingCart className="w-4 h-4" />
      });
    } else if (segments[2] === "analytics") {
      breadcrumbs.push({
        label: "Analytics",
        href: `/dashboard/${segments[1]}/analytics`,
        icon: <BarChart3 className="w-4 h-4" />
      });
    } else if (segments[2] === "customers") {
      breadcrumbs.push({
        label: "Customers",
        href: `/dashboard/${segments[1]}/customers`,
        icon: <Users className="w-4 h-4" />
      });
    } else if (segments[2] === "settings") {
      breadcrumbs.push({
        label: "Settings",
        href: `/dashboard/${segments[1]}/settings`,
        icon: <Settings className="w-4 h-4" />
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs(pathname);

  // Don't show breadcrumb if we're on the main dashboard page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href && index < breadcrumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link 
                    href={item.href} 
                    className="flex items-center gap-1 hover:text-foodeez-primary transition-colors text-sm sm:text-base"
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">
                      {item.label.length > 12 ? item.label.substring(0, 12) + '...' : item.label}
                    </span>
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1 text-sm sm:text-base font-medium">
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">
                    {item.label.length > 12 ? item.label.substring(0, 12) + '...' : item.label}
                  </span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 