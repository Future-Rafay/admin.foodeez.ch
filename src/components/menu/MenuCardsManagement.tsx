"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  MenuCardAvailability,
  MenuCardRecordStatus,
  MenuCardRow,
} from "@/services/menu-management";

type MenuCardsManagementProps = {
  businessId: number;
  initialMenuCards: MenuCardRow[];
};

type FilterValue = "all" | MenuCardAvailability;
type MenuCardFormValues = {
  title: string;
  validFrom: string;
  validTo: string;
  status: MenuCardRecordStatus;
};

const filterTabs: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
];

export default function MenuCardsManagement({
  businessId,
  initialMenuCards,
}: MenuCardsManagementProps) {
  const [menuCards, setMenuCards] = useState(initialMenuCards);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MenuCardRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuCardRow | null>(null);
  const [formValues, setFormValues] = useState<MenuCardFormValues>(
    getDefaultFormValues()
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const filteredCards = useMemo(() => {
    if (filter === "all") return menuCards;
    return menuCards.filter(
      (card) => card.status === "active" && card.availability === filter
    );
  }, [filter, menuCards]);

  async function reloadMenuCards() {
    const res = await fetch(`/api/dashboard/${businessId}/menu-cards`);
    if (!res.ok) throw new Error("Failed to reload menu cards.");

    const data = await res.json();
    setMenuCards(data.menuCards);
  }

  function openCreate() {
    setEditingCard(null);
    setFormValues(getDefaultFormValues());
    setError("");
    setFormOpen(true);
  }

  function openEdit(card: MenuCardRow) {
    setEditingCard(card);
    setFormValues({
      title: card.title,
      validFrom: card.validFrom || todayInputValue(),
      validTo: card.validTo || addDaysInputValue(30),
      status: card.status,
    });
    setError("");
    setFormOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingCard
        ? `/api/dashboard/${businessId}/menu-cards/${editingCard.id}`
        : `/api/dashboard/${businessId}/menu-cards`;
      const res = await fetch(url, {
        method: editingCard ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save menu card.");
      }

      await reloadMenuCards();
      setFormOpen(false);
      setEditingCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save menu card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(card: MenuCardRow) {
    setActionId(card.id);
    setError("");

    try {
      const res = await fetch(`/api/dashboard/${businessId}/menu-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateFromId: card.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to duplicate menu card.");
      }

      await reloadMenuCards();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate menu card."
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/dashboard/${businessId}/menu-cards/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete menu card.");
      }

      setMenuCards((current) =>
        current.filter((card) => card.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete menu card."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-foodeez-primary/10 text-foodeez-primary">
                <Utensils className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Menu Cards
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Build menus from categories, with products flowing in from
                  category tags.
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="bg-foodeez-primary text-white hover:bg-foodeez-secondary"
          >
            <Plus className="size-4" />
            Create Menu
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterValue)}
          >
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
              {filterTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-sm text-gray-500">
            {filteredCards.length} of {menuCards.length} menus
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {filteredCards.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-950">
                      {card.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MenuCardStatusBadge card={card} />
                    </div>
                  </div>
                  <MenuCardActions
                    disabled={actionId === card.id}
                    onEdit={() => openEdit(card)}
                    onDuplicate={() => void handleDuplicate(card)}
                    onDelete={() => setDeleteTarget(card)}
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-gray-400" />
                    {formatDateRange(card.validFrom, card.validTo)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Layers3 className="size-4 text-gray-400" />
                    {card.categoryCount} categories &middot; {card.productCount}{" "}
                    products
                  </p>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/${businessId}/menu/${card.id}`}>
                    Manage
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState onCreate={openCreate} />
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Edit menu card" : "Create menu card"}
            </DialogTitle>
            <DialogDescription>
              Set the customer-facing menu title, date range, and availability.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="menu-title">Menu Title</Label>
              <Input
                id="menu-title"
                value={formValues.title}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Weekend Menu"
                className="mt-2"
                maxLength={45}
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="valid-from">Valid From</Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={formValues.validFrom}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      validFrom: event.target.value,
                    }))
                  }
                  className="mt-2"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="valid-to">Valid To</Label>
                <Input
                  id="valid-to"
                  type="date"
                  value={formValues.validTo}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      validTo: event.target.value,
                    }))
                  }
                  className="mt-2"
                  required
                  disabled={saving}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <Label htmlFor="menu-status">Status</Label>
                <p className="text-sm text-gray-500">
                  {formValues.status === "active"
                    ? "Menu is enabled"
                    : "Menu is disabled"}
                </p>
              </div>
              <Switch
                id="menu-status"
                checked={formValues.status === "active"}
                onCheckedChange={(checked) =>
                  setFormValues((current) => ({
                    ...current,
                    status: checked ? "active" : "inactive",
                  }))
                }
                disabled={saving}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save menu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete menu card</DialogTitle>
            <DialogDescription>
              This removes the menu card and its category assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuCardActions({
  disabled,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  disabled: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={disabled}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu card actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Edit title/dates
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuCardStatusBadge({ card }: { card: MenuCardRow }) {
  if (card.status === "inactive") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        Inactive
      </Badge>
    );
  }

  const styles = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    scheduled: "border-blue-200 bg-blue-50 text-blue-700",
    expired: "border-gray-200 bg-gray-50 text-gray-600",
  } satisfies Record<MenuCardAvailability, string>;

  return (
    <Badge variant="outline" className={styles[card.availability]}>
      {card.availability}
    </Badge>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-foodeez-primary/10 text-foodeez-primary">
        <Utensils className="size-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-950">
        No menu cards found
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Create a menu card, then assign categories to shape what customers see.
      </p>
      <Button
        onClick={onCreate}
        className="mt-5 bg-foodeez-primary text-white hover:bg-foodeez-secondary"
      >
        <Plus className="size-4" />
        Create Menu
      </Button>
    </div>
  );
}

function getDefaultFormValues(): MenuCardFormValues {
  return {
    title: "",
    validFrom: todayInputValue(),
    validTo: addDaysInputValue(30),
    status: "active",
  };
}

function todayInputValue() {
  return toInputValue(new Date());
}

function addDaysInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputValue(date);
}

function toInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
