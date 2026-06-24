"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const adminNavItems = [
  {
    label: "Dashboard",
    href: "",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ReceiptText,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  businessId: string;
  restaurantName?: string;
  onNavigate?: () => void;
  className?: string;
  collapseOnMedium?: boolean;
}

export default function AdminSidebar({
  businessId,
  restaurantName = "Selected restaurant",
  onNavigate,
  className,
  collapseOnMedium = true,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${businessId}`;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white text-gray-900",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-gray-100 px-4 lg:px-5">
        <Link
          href={basePath}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
          aria-label="Foodeez admin dashboard"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foodeez-primary/10">
            <Image
              src="/images/Logo/Logo.png"
              alt="Foodeez"
              width={28}
              height={28}
              className="rounded"
            />
          </div>
          <div
            className={cn(
              "min-w-0",
              collapseOnMedium ? "hidden lg:block" : "block"
            )}
          >
            <p className="truncate text-sm font-semibold text-gray-950">
              Foodeez
            </p>
            <p className="truncate text-xs text-gray-500">Admin panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminNavItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === basePath
              : pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
                collapseOnMedium && "md:justify-center lg:justify-start",
                isActive &&
                  "bg-foodeez-primary/10 text-foodeez-primary shadow-[inset_3px_0_0_var(--foodeez-primary)] hover:bg-foodeez-primary/10 hover:text-foodeez-primary"
              )}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <Icon className="size-5 shrink-0" />
              <span
                className={cn(
                  "truncate",
                  collapseOnMedium ? "hidden lg:inline" : "inline"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div
          className={cn(
            "mb-3 rounded-lg bg-gray-50 p-3",
            collapseOnMedium ? "hidden lg:block" : "block"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Restaurant
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-gray-950">
            {restaurantName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50",
            collapseOnMedium && "md:justify-center lg:justify-start"
          )}
          title="Logout"
        >
          <LogOut className="size-5 shrink-0" />
          <span className={cn(collapseOnMedium ? "hidden lg:inline" : "inline")}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
