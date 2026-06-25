"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  Eye,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type {
  MenuCardAvailableCategory,
  MenuCardDetailRow,
  MenuCardPreviewProduct,
  MenuCardWorkspace,
} from "@/services/menu-management";

type MenuCardDetailManagementProps = {
  businessId: number;
  initialWorkspace: MenuCardWorkspace;
};

type LocalDetailRow = MenuCardDetailRow & {
  isNew?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CHF",
});

export default function MenuCardDetailManagement({
  businessId,
  initialWorkspace,
}: MenuCardDetailManagementProps) {
  const [card, setCard] = useState(initialWorkspace.card);
  const [availableCategories, setAvailableCategories] = useState(
    initialWorkspace.availableCategories
  );
  const [details, setDetails] = useState<LocalDetailRow[]>(
    initialWorkspace.details
  );
  const [removedDetailIds, setRemovedDetailIds] = useState<Set<number>>(
    new Set()
  );
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [error, setError] = useState("");

  async function reloadWorkspace() {
    const res = await fetch(
      `/api/dashboard/${businessId}/menu-cards/${card.id}/details`
    );
    if (!res.ok) throw new Error("Failed to reload menu card.");

    const data = (await res.json()) as MenuCardWorkspace;
    setCard(data.card);
    setAvailableCategories(data.availableCategories);
    setDetails(data.details);
    setRemovedDetailIds(new Set());
    setHasUnsavedChanges(false);
  }

  function handleAddCategory(category: MenuCardAvailableCategory) {
    const tempId = -Date.now();
    const displayOrder =
      Math.max(0, ...details.map((detail) => detail.displayOrder)) + 1;
    const optimisticDetail: LocalDetailRow = {
      id: tempId,
      categoryId: category.id,
      categoryTitle: category.title,
      productCount: category.productCount,
      displayOrder,
      products: [],
      isNew: true,
    };

    setError("");
    setAvailableCategories((current) =>
      current.filter((item) => item.id !== category.id)
    );
    setDetails((current) => [...current, optimisticDetail]);
    setHasUnsavedChanges(true);
  }

  function handleRemoveCategory(detail: LocalDetailRow) {
    setError("");
    setDetails((current) =>
      current
        .filter((item) => item.id !== detail.id)
        .map((item, index) => ({ ...item, displayOrder: index + 1 }))
    );
    setAvailableCategories((current) =>
      sortCategories([
        ...current,
        {
          id: detail.categoryId,
          title: detail.categoryTitle,
          productCount: detail.productCount,
        },
      ])
    );
    if (!detail.isNew && detail.id > 0) {
      setRemovedDetailIds((current) => new Set(current).add(detail.id));
    }
    setHasUnsavedChanges(true);
  }

  function toggleExpanded(detailId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(detailId)) {
        next.delete(detailId);
      } else {
        next.add(detailId);
      }

      return next;
    });
  }

  function handleDrop(targetId: number) {
    if (draggingId === null || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const fromIndex = details.findIndex((detail) => detail.id === draggingId);
    const toIndex = details.findIndex((detail) => detail.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null);
      return;
    }

    const reordered = [...details];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const nextDetails = reordered.map((detail, index) => ({
      ...detail,
      displayOrder: index + 1,
    }));

    setDraggingId(null);
    setDetails(nextDetails);
    setHasUnsavedChanges(true);
  }

  async function handleSaveChanges() {
    setSavingChanges(true);
    setError("");

    try {
      for (const detailId of removedDetailIds) {
        const res = await fetch(
          `/api/dashboard/${businessId}/menu-cards/${card.id}/details/${detailId}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to remove category.");
        }
      }

      const createdDetails = new Map<number, MenuCardDetailRow>();

      for (const detail of details.filter((item) => item.isNew)) {
        const res = await fetch(
          `/api/dashboard/${businessId}/menu-cards/${card.id}/details`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: detail.categoryId,
              displayOrder: detail.displayOrder,
            }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add category.");
        }

        const data = await res.json();
        createdDetails.set(detail.id, data.detail);
      }

      const savedDetails = details
        .map((detail) =>
          detail.isNew ? createdDetails.get(detail.id) || null : detail
        )
        .filter((detail): detail is MenuCardDetailRow => detail !== null);
      const reorderPayload = savedDetails
        .map((detail) => ({
          detailId: detail.id,
          displayOrder: detail.displayOrder,
        }));

      if (reorderPayload.length) {
        const res = await fetch(
          `/api/dashboard/${businessId}/menu-cards/${card.id}/details/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reorderPayload),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to reorder categories.");
        }
      }

      await reloadWorkspace();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save menu changes."
      );
    } finally {
      setSavingChanges(false);
    }
  }

  async function handleDiscardChanges() {
    setSavingChanges(true);
    setError("");

    try {
      await reloadWorkspace();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reload menu card."
      );
    } finally {
      setSavingChanges(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">
            <Link
              href={`/dashboard/${businessId}/menu`}
              className="font-medium text-foodeez-primary hover:text-foodeez-secondary"
            >
              Menu Cards
            </Link>
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-950">
            {card.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {formatDateRange(card.validFrom, card.validTo)} &middot;{" "}
            {card.categoryCount} categories &middot; {card.productCount} products
          </p>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h3 className="font-semibold text-gray-950">
              Add Categories to this Menu
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Only categories not yet assigned are shown.
            </p>
          </div>
          <div className="max-h-[620px] space-y-2 overflow-y-auto p-4">
            {availableCategories.length ? (
              availableCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-950">
                      {category.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.productCount} products
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCategory(category)}
                    disabled={savingChanges}
                  >
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <Utensils className="size-6" />
                </div>
                <h4 className="font-medium text-gray-950">
                  All categories assigned
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Remove a category from the menu to make it available again.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h3 className="font-semibold text-gray-950">
              Categories in this Menu
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Drag categories to change their customer-facing order.
            </p>
          </div>
          <div className="space-y-3 p-4">
            {details.length ? (
              details.map((detail) => (
                <CategoryDetailCard
                  key={detail.id}
                  detail={detail}
                  expanded={expandedIds.has(detail.id)}
                  dragging={draggingId === detail.id}
                  actionDisabled={savingChanges}
                  onToggle={() => toggleExpanded(detail.id)}
                  onRemove={() => handleRemoveCategory(detail)}
                  onDragStart={() => setDraggingId(detail.id)}
                  onDrop={() => handleDrop(detail.id)}
                  onDragEnd={() => setDraggingId(null)}
                />
              ))
            ) : (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-foodeez-primary/10 text-foodeez-primary">
                  <Utensils className="size-7" />
                </div>
                <h4 className="font-semibold text-gray-950">
                  No categories in this menu
                </h4>
                <p className="mt-2 text-sm text-gray-500">
                  Add categories from the left panel to build this menu card.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {hasUnsavedChanges
            ? "You have unsaved menu changes."
            : "All menu changes are saved."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            disabled={savingChanges}
          >
            <Eye className="size-4" />
            Preview Menu as Customer
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDiscardChanges()}
            disabled={!hasUnsavedChanges || savingChanges}
          >
            <RotateCcw className="size-4" />
            Discard
          </Button>
          <Button
            onClick={() => void handleSaveChanges()}
            disabled={!hasUnsavedChanges || savingChanges}
            className="bg-foodeez-primary text-white hover:bg-foodeez-secondary"
          >
            <Save className="size-4" />
            {savingChanges ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <CustomerPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={card.title}
        dateRange={formatDateRange(card.validFrom, card.validTo)}
        details={details}
      />
    </div>
  );
}

function CategoryDetailCard({
  detail,
  expanded,
  dragging,
  actionDisabled,
  onToggle,
  onRemove,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  detail: LocalDetailRow;
  expanded: boolean;
  dragging: boolean;
  actionDisabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={!actionDisabled}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 transition-colors",
        dragging && "border-foodeez-primary bg-foodeez-primary/5",
        detail.isNew && "border-amber-200 bg-amber-50/40"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="cursor-grab rounded-md border border-gray-200 p-2 text-gray-400 active:cursor-grabbing"
            aria-label="Drag category"
            disabled={actionDisabled}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-gray-400 transition-transform",
                expanded && "rotate-180"
              )}
            />
            <span className="truncate font-medium text-gray-950">
              {detail.categoryTitle}
            </span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="outline">{detail.productCount} products</Badge>
          <Badge variant="outline">Order {detail.displayOrder}</Badge>
          {detail.isNew && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              Unsaved
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={actionDisabled}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4">
          <ProductPreviewList products={detail.products} />
        </div>
      )}
    </div>
  );
}

function ProductPreviewList({
  products,
}: {
  products: MenuCardPreviewProduct[];
}) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No products are currently visible from the customer preview view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="hidden grid-cols-[72px_1fr_120px_100px] gap-3 bg-gray-50 px-4 py-2 text-xs font-medium uppercase text-gray-500 sm:grid">
        <span>Image</span>
        <span>Name</span>
        <span>Price</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-gray-100">
        {products.map((product) => (
          <div
            key={product.id}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[72px_1fr_120px_100px] sm:items-center"
          >
            <ProductImage product={product} />
            <div className="min-w-0">
              <p className="font-medium text-gray-950">{product.name}</p>
              {product.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {product.description}
                </p>
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {currencyFormatter.format(product.price)}
            </p>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {product.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: MenuCardPreviewProduct }) {
  const imageUrl = resolveMediaUrl(product.pic);

  if (!imageUrl) {
    return (
      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        <Utensils className="size-5" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={product.name}
      width={48}
      height={48}
      className="size-12 rounded-lg object-cover"
      unoptimized={imageUrl.startsWith("http")}
    />
  );
}

function CustomerPreviewDialog({
  open,
  onOpenChange,
  title,
  dateRange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  dateRange: string;
  details: LocalDetailRow[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Customer menu preview</DialogTitle>
          <DialogDescription>
            Read-only preview of the products currently returned by the menu
            card detail view.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="bg-foodeez-primary px-6 py-8 text-white">
            <p className="text-sm uppercase tracking-wide text-white/80">
              Foodeez Menu
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-white/80">{dateRange}</p>
          </div>
          <div className="space-y-8 p-6">
            {details.length ? (
              details.map((detail) => (
                <section key={detail.id}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-950">
                      {detail.categoryTitle}
                    </h4>
                    <Badge variant="outline">
                      {detail.products.length} visible
                    </Badge>
                  </div>
                  {detail.products.length ? (
                    <div className="space-y-3">
                      {detail.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex gap-3 rounded-lg border border-gray-100 p-3"
                        >
                          <ProductImage product={product} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-950">
                                  {product.name}
                                </p>
                                {product.description && (
                                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                              <p className="shrink-0 font-semibold text-gray-950">
                                {currencyFormatter.format(product.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      No visible products for this category right now.
                    </p>
                  )}
                </section>
              ))
            ) : (
              <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Add categories to this menu to preview it.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function sortCategories(categories: MenuCardAvailableCategory[]) {
  return [...categories].sort((first, second) =>
    first.title.localeCompare(second.title)
  );
}

function formatDateRange(validFrom: string | null, validTo: string | null) {
  if (!validFrom && !validTo) return "No date range";
  if (!validFrom) return `Until ${formatDate(validTo, true)}`;
  if (!validTo) return `From ${formatDate(validFrom, true)}`;

  const fromYear = validFrom.slice(0, 4);
  const toYear = validTo.slice(0, 4);

  return fromYear === toYear
    ? `${formatDate(validFrom)} - ${formatDate(validTo, true)}`
    : `${formatDate(validFrom, true)} - ${formatDate(validTo, true)}`;
}

function formatDate(value: string | null, includeYear = false) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}
