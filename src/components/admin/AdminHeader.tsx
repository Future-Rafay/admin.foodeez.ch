"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Plus } from "lucide-react";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react"; // FIXED: Quick Actions dropdown

interface AdminHeaderProps {
  businessId: string;
  mobileNavigation?: ReactNode;
}

function humanizeSegment(segment: string) {
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function useClickOutside( // FIXED: Quick Actions dropdown
  ref: RefObject<HTMLElement | null>, // FIXED: Quick Actions dropdown
  onClickOutside: () => void // FIXED: Quick Actions dropdown
) { // FIXED: Quick Actions dropdown
  useEffect(() => { // FIXED: Quick Actions dropdown
    function handlePointerDown(event: MouseEvent | TouchEvent) { // FIXED: Quick Actions dropdown
      if (ref.current && !ref.current.contains(event.target as Node)) { // FIXED: Quick Actions dropdown
        onClickOutside(); // FIXED: Quick Actions dropdown
      } // FIXED: Quick Actions dropdown
    } // FIXED: Quick Actions dropdown

    document.addEventListener("mousedown", handlePointerDown); // FIXED: Quick Actions dropdown
    document.addEventListener("touchstart", handlePointerDown); // FIXED: Quick Actions dropdown

    return () => { // FIXED: Quick Actions dropdown
      document.removeEventListener("mousedown", handlePointerDown); // FIXED: Quick Actions dropdown
      document.removeEventListener("touchstart", handlePointerDown); // FIXED: Quick Actions dropdown
    }; // FIXED: Quick Actions dropdown
  }, [onClickOutside, ref]); // FIXED: Quick Actions dropdown
} // FIXED: Quick Actions dropdown

export default function AdminHeader({
  businessId,
  mobileNavigation,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false); // FIXED: Quick Actions dropdown
  const quickActionsRef = useRef<HTMLDivElement | null>(null); // FIXED: Quick Actions dropdown
  const basePath = `/dashboard/${businessId}`;
  useClickOutside(quickActionsRef, () => setIsQuickActionsOpen(false)); // FIXED: Quick Actions dropdown
  const childSegments = pathname
    .replace(basePath, "")
    .split("/")
    .filter(Boolean);
  const crumbs = [
    { label: "Dashboard", href: basePath },
    ...childSegments.map((segment, index) => ({
      label: humanizeSegment(segment),
      href: `${basePath}/${childSegments.slice(0, index + 1).join("/")}`,
    })),
  ];
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {mobileNavigation}
          <div className="min-w-0">
            <nav className="flex items-center text-xs font-medium text-gray-500">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;

                return (
                  <span key={crumb.href} className="flex min-w-0 items-center">
                    {index > 0 && (
                      <ChevronRight className="mx-1.5 size-3.5 shrink-0 text-gray-400" />
                    )}
                    {isLast ? (
                      <span className="truncate text-gray-700">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="truncate transition-colors hover:text-foodeez-primary"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-950"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </button>
          <div className="relative" ref={quickActionsRef}> {/* FIXED: Quick Actions dropdown */}
            <button
              type="button"
              onClick={() => setIsQuickActionsOpen((open) => !open)} // FIXED: Quick Actions dropdown
              className="inline-flex items-center gap-2 rounded-lg bg-foodeez-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-foodeez-secondary"
              aria-expanded={isQuickActionsOpen} // FIXED: Quick Actions dropdown
              aria-haspopup="menu" // FIXED: Quick Actions dropdown
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Quick actions</span>
            </button>
            {isQuickActionsOpen && ( // FIXED: Quick Actions dropdown
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"> {/* FIXED: Quick Actions dropdown */}
                <Link // FIXED: Quick Actions dropdown
                  href={`${basePath}/menu/products/new`} // FIXED: Quick Actions dropdown
                  onClick={() => setIsQuickActionsOpen(false)} // FIXED: Quick Actions dropdown
                  className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-950" // FIXED: Quick Actions dropdown
                > {/* FIXED: Quick Actions dropdown */}
                  New Product
                </Link>
                <Link // FIXED: Quick Actions dropdown
                  href={`${basePath}/menu/categories/new`} // FIXED: Quick Actions dropdown
                  onClick={() => setIsQuickActionsOpen(false)} // FIXED: Quick Actions dropdown
                  className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-950" // FIXED: Quick Actions dropdown
                > {/* FIXED: Quick Actions dropdown */}
                  New Category
                </Link>
                <Link // FIXED: Quick Actions dropdown
                  href={`${basePath}/orders`} // FIXED: Quick Actions dropdown
                  onClick={() => setIsQuickActionsOpen(false)} // FIXED: Quick Actions dropdown
                  className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-950" // FIXED: Quick Actions dropdown
                > {/* FIXED: Quick Actions dropdown */}
                  View Orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
