"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MoreHorizontal,
  PackageCheck,
  Search,
  Wallet,
  XCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  AdminOrderRow,
  DateRangeFilter,
  OrderStatus,
  OrdersKpis,
} from "@/services/orders-management";

type OrdersResponse = {
  kpis: OrdersKpis;
  orders: AdminOrderRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

type StatusFilter = "all" | OrderStatus;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CHF",
});

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

const dateRangeOptions: { label: string; value: DateRangeFilter }[] = [
  { label: "All dates", value: "all" }, // FIXED: Orders table date filter mismatch
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7" },
  { label: "Custom", value: "custom" },
];

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    new: "New",
    preparing: "Preparing",
    ready: "Ready",
    delivered: "Delivered",
    rejected: "Rejected",
  };

  return labels[status];
}

function statusBadgeClass(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    new: "border-yellow-200 bg-yellow-50 text-yellow-800",
    preparing: "border-blue-200 bg-blue-50 text-blue-700",
    ready: "border-purple-200 bg-purple-50 text-purple-700",
    delivered: "border-green-200 bg-green-50 text-green-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return classes[status];
}

function formatOrderedAt(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getOrderActions(status: OrderStatus) {
  if (status === "new") {
    return [
      { label: "Accept", status: "preparing" as OrderStatus },
      { label: "Reject", status: "rejected" as OrderStatus },
    ];
  }

  if (status === "preparing") {
    return [{ label: "Mark Ready", status: "ready" as OrderStatus }];
  }

  if (status === "ready") {
    return [{ label: "Mark Delivered", status: "delivered" as OrderStatus }];
  }

  return [];
}

export default function AdminOrdersPage({ businessId }: { businessId: number }) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [kpis, setKpis] = useState<OrdersKpis>({
    newPendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
    deliveredTodayCount: 0,
    revenueToday: 0,
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all"); // FIXED: Orders table date filter mismatch
  const [startDate, setStartDate] = useState(todayInputValue);
  const [endDate, setEndDate] = useState(todayInputValue);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      status,
      dateRange,
      search,
      page: page.toString(),
    });

    if (dateRange === "custom") {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }

    return params.toString();
  }, [dateRange, endDate, page, search, startDate, status]);

  const loadOrders = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/dashboard/${businessId}/orders?${queryString}`,
          { signal }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to load orders");
        }

        const data = (await response.json()) as OrdersResponse;
        setOrders(data.orders);
        setKpis(data.kpis);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setError(error instanceof Error ? error.message : "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    },
    [businessId, queryString]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => controller.abort();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [dateRange, endDate, search, startDate, status]);

  async function updateStatus(order: AdminOrderRow, nextStatus: OrderStatus) {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `/api/dashboard/${businessId}/orders/${order.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update order status");
      }

      const updatedOrder = (await response.json()) as AdminOrderRow;
      setSelectedOrder((current) =>
        current?.id === updatedOrder.id ? updatedOrder : current
      );
      await loadOrders();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update order status"
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const kpiCards = [
    {
      label: "New/Pending",
      value: kpis.newPendingCount,
      icon: Clock3,
      className: "bg-yellow-50 text-yellow-800",
    },
    {
      label: "Preparing",
      value: kpis.preparingCount,
      icon: PackageCheck,
      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "Ready",
      value: kpis.readyCount,
      icon: CheckCircle2,
      className: "bg-purple-50 text-purple-700",
    },
    {
      label: "Delivered today",
      value: kpis.deliveredTodayCount,
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700",
    },
    {
      label: "Revenue today",
      value: currencyFormatter.format(kpis.revenueToday),
      icon: Wallet,
      className: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      card.className
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_1fr]">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as DateRangeFilter)}
            >
              <SelectTrigger className="h-10 w-full bg-white">
                <CalendarDays className="size-4 text-gray-500" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order number or customer name"
                className="h-10 bg-white pl-9"
              />
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <OrdersSkeleton />
          ) : orders.length ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer name</TableHead>
                      <TableHead>Items summary</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered at</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-950">
                          #{order.id}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {order.itemsSummary}
                        </TableCell>
                        <TableCell>
                          {currencyFormatter.format(order.total)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatOrderedAt(order.orderedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Order actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {getOrderActions(order.status).map((action) => (
                                <DropdownMenuItem
                                  key={action.status}
                                  disabled={isUpdating}
                                  onClick={() => updateStatus(order, action.status)}
                                >
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                              {getOrderActions(order.status).length > 0 && (
                                <div className="my-1 h-px bg-gray-100" />
                              )}
                              <DropdownMenuItem
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="size-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing page {page} of {totalPages} ({totalCount} orders)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                <XCircle className="size-7" />
              </div>
              <h2 className="text-lg font-semibold text-gray-950">
                No orders found
              </h2>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Try changing the status, date range, or search filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsModal
        order={selectedOrder}
        isUpdating={isUpdating}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusBadgeClass(status))}>
      {statusLabel(status)}
    </Badge>
  );
}

function OrdersSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-7 gap-4 border-b border-gray-100 bg-gray-50 p-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-4 p-4">
            {Array.from({ length: 7 }).map((_, cellIndex) => (
              <Skeleton key={cellIndex} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  isUpdating,
  onClose,
  onUpdateStatus,
}: {
  order: AdminOrderRow | null;
  isUpdating: boolean;
  onClose: () => void;
  onUpdateStatus: (order: AdminOrderRow, status: OrderStatus) => Promise<void>;
}) {
  if (!order) return null;

  const actions = getOrderActions(order.status);

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
          <DialogDescription>
            {formatOrderedAt(order.orderedAt)} · <StatusBadge status={order.status} />
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-950">Customer</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p>{order.phone || "No phone number"}</p>
              <p>{order.address || "No delivery address"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-950">Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>{currencyFormatter.format(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-950">
                <span>Order total</span>
                <span>{currencyFormatter.format(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead>Product name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length ? (
                order.items.map((item, index) => (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {currencyFormatter.format(item.unitPrice)}
                    </TableCell>
                    <TableCell>
                      {currencyFormatter.format(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                    No order items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
              disabled={isUpdating}
              onClick={() => onUpdateStatus(order, action.status)}
              className="bg-foodeez-primary text-white hover:bg-foodeez-secondary"
            >
              {action.label}
            </Button>
          ))}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
