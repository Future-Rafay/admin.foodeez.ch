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
  NormalizedOrderStatus,
  OrdersKpis,
} from "@/services/orders-management";

type OrdersResponse = {
  orders: AdminOrderRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  kpi: OrdersKpis;
};

type StatusFilter = "all" | NormalizedOrderStatus;
type DateRangeFilter = "all" | "today" | "last7" | "custom";
type OrderAction = {
  label: string;
  status: NormalizedOrderStatus;
  variant?: "destructive";
};

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CHF",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "New/Pending", value: "new" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

const dateRangeOptions: { label: string; value: DateRangeFilter }[] = [
  { label: "All dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7" },
  { label: "Custom", value: "custom" },
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeBounds(dateRange: DateRangeFilter) {
  if (dateRange === "all" || dateRange === "custom") {
    return { dateFrom: "", dateTo: "" };
  }

  const today = new Date();

  if (dateRange === "today") {
    return { dateFrom: formatInputDate(today), dateTo: formatInputDate(today) };
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  return { dateFrom: formatInputDate(start), dateTo: formatInputDate(today) };
}

function customerName(order: AdminOrderRow) {
  return [order.VISITOR_FIRST_NAME, order.VISITOR_LAST_NAME]
    .filter(Boolean)
    .join(" ")
    .trim() || "Guest customer";
}

function itemsSummary(order: AdminOrderRow) {
  return `${order.item_count} ${order.item_count === 1 ? "item" : "items"}`;
}

function statusLabel(status: NormalizedOrderStatus) {
  const labels: Record<NormalizedOrderStatus, string> = {
    pending: "Pending",
    new: "New",
    preparing: "Preparing",
    ready: "Ready",
    delivered: "Delivered",
    rejected: "Rejected",
  };

  return labels[status];
}

function statusBadgeClass(status: NormalizedOrderStatus) {
  if (status === "new" || status === "pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800";
  }

  const classes: Record<
    Exclude<NormalizedOrderStatus, "new" | "pending">,
    string
  > = {
    preparing: "border-blue-200 bg-blue-50 text-blue-700",
    ready: "border-purple-200 bg-purple-50 text-purple-700",
    delivered: "border-green-200 bg-green-50 text-green-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return classes[status];
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  return dateTimeFormatter.format(new Date(value));
}

function getOrderActions(status: NormalizedOrderStatus): OrderAction[] {
  if (status === "new" || status === "pending") {
    return [
      { label: "Accept -> Preparing", status: "preparing" as const },
      { label: "Reject", status: "rejected" as const, variant: "destructive" },
    ];
  }

  if (status === "preparing") {
    return [{ label: "Mark Ready", status: "ready" as const }];
  }

  if (status === "ready") {
    return [{ label: "Mark Delivered", status: "delivered" as const }];
  }

  return [];
}

export default function AdminOrdersPage({ businessId }: { businessId: number }) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [kpi, setKpi] = useState<OrdersKpis>({
    new: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    revenue_today: 0,
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [dateFrom, setDateFrom] = useState(todayInputValue);
  const [dateTo, setDateTo] = useState(todayInputValue);
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
      search,
      page: page.toString(),
      limit: PAGE_SIZE.toString(),
    });
    const presetBounds = getDateRangeBounds(dateRange);
    const rangeFrom = dateRange === "custom" ? dateFrom : presetBounds.dateFrom;
    const rangeTo = dateRange === "custom" ? dateTo : presetBounds.dateTo;

    if (rangeFrom) params.set("dateFrom", rangeFrom);
    if (rangeTo) params.set("dateTo", rangeTo);

    return params.toString();
  }, [dateFrom, dateRange, dateTo, page, search, status]);

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
        setKpi(data.kpi);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
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
  }, [dateFrom, dateRange, dateTo, search, status]);

  async function updateStatus(
    order: AdminOrderRow,
    nextStatus: NormalizedOrderStatus
  ) {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `/api/dashboard/${businessId}/orders/${order.BUSINESS_ORDER_ID}/status`,
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
        current?.BUSINESS_ORDER_ID === updatedOrder.BUSINESS_ORDER_ID
          ? updatedOrder
          : current
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
      value: kpi.new,
      icon: Clock3,
      className: "bg-yellow-50 text-yellow-800",
    },
    {
      label: "Preparing",
      value: kpi.preparing,
      icon: PackageCheck,
      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "Ready",
      value: kpi.ready,
      icon: CheckCircle2,
      className: "bg-purple-50 text-purple-700",
    },
    {
      label: "Delivered",
      value: kpi.delivered,
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700",
    },
    {
      label: "Revenue today",
      value: currencyFormatter.format(kpi.revenue_today),
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
                placeholder="Search by order number, customer, email, or phone"
                className="h-10 bg-white pl-9"
              />
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md">
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
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
                      <TableHead>Customer</TableHead>
                      <TableHead>Items summary</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered at</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.BUSINESS_ORDER_ID}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-medium text-gray-950">
                          #{order.BUSINESS_ORDER_ID}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-950">
                            {customerName(order)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.VISITOR_PHONE || "No phone"}
                          </div>
                        </TableCell>
                        <TableCell>{itemsSummary(order)}</TableCell>
                        <TableCell>
                          {currencyFormatter.format(order.FINAL_AMOUNT)}
                        </TableCell>
                        <TableCell>{order.PAYMENT_MODE || "Not set"}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(order.CREATION_DATETIME)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Order actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {getOrderActions(order.status).map((action) => (
                                <DropdownMenuItem
                                  key={action.status}
                                  disabled={isUpdating}
                                  className={cn(
                                    action.variant === "destructive" &&
                                      "text-red-600 focus:text-red-700"
                                  )}
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

function StatusBadge({ status }: { status: NormalizedOrderStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusBadgeClass(status))}>
      {statusLabel(status)}
    </Badge>
  );
}

function OrdersSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-8 gap-4 border-b border-gray-100 bg-gray-50 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-4 p-4">
            {Array.from({ length: 8 }).map((_, cellIndex) => (
              <Skeleton key={cellIndex} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function MoneyLine({
  label,
  value,
  danger,
  total,
}: {
  label: string;
  value: number;
  danger?: boolean;
  total?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm",
        total && "border-t border-gray-100 pt-3 text-base font-semibold"
      )}
    >
      <span className={cn(total ? "text-gray-950" : "text-gray-500")}>
        {label}
      </span>
      <span
        className={cn(
          total ? "text-lg text-gray-950" : "font-medium text-gray-900",
          danger && value > 0 && "text-red-600"
        )}
      >
        {currencyFormatter.format(value)}
      </span>
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
  onUpdateStatus: (
    order: AdminOrderRow,
    status: NormalizedOrderStatus
  ) => Promise<void>;
}) {
  if (!order) return null;

  const actions = getOrderActions(order.status);
  const isRejected = order.status === "rejected";
  const isCompleted = order.status === "delivered";

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Order #{order.BUSINESS_ORDER_ID}</DialogTitle>
          <DialogDescription>
            Full order, customer, payment, and item details from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-950">
                Order #{order.BUSINESS_ORDER_ID}
              </h3>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-2">
              <DetailLine
                label="Placed at"
                value={formatDateTime(order.CREATION_DATETIME)}
              />
              <DetailLine
                label="Est. Delivery"
                value={formatDateTime(order.DELIVERY_ET)}
              />
              <DetailLine
                label="Payment"
                value={order.PAYMENT_MODE || "Not set"}
              />
              {order.STAFF_MEMBER && (
                <DetailLine label="Staff" value={order.STAFF_MEMBER} />
              )}
              {order.TERMINAL && (
                <DetailLine label="Terminal" value={order.TERMINAL} />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  disabled={isUpdating}
                  variant={action.variant === "destructive" ? "destructive" : "default"}
                  onClick={() => onUpdateStatus(order, action.status)}
                  className={cn(
                    action.variant !== "destructive" &&
                      "bg-foodeez-primary text-white hover:bg-foodeez-secondary"
                  )}
                >
                  {action.label}
                </Button>
              ))}
              {isCompleted && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                  Completed
                </Badge>
              )}
              {isRejected && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                  Rejected
                </Badge>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-950">Customer</h3>
            <div className="mt-3 space-y-2">
              <DetailLine label="Full name" value={customerName(order)} />
              <DetailLine
                label="Phone"
                value={order.VISITOR_PHONE || "No phone"}
              />
              <DetailLine
                label="Email"
                value={order.VISITOR_EMAIL || "No email"}
              />
              <DetailLine
                label="Delivery address"
                value={order.DELIVERY_ADDRESS || "No delivery address"}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-950">
              Financial summary
            </h3>
            <div className="mt-3 space-y-2">
              <MoneyLine label="Gross" value={order.GROSS_AMOUNT} />
              <MoneyLine
                label="Discount"
                value={order.DISCOUNT_AMOUNT}
                danger
              />
              <MoneyLine label="Shipping" value={order.SHIPPING_AMOUNT} />
              <MoneyLine label="Tax" value={order.TAX_AMOUNT} />
              <MoneyLine label="Refund" value={order.REFUND_AMOUNT} danger />
              <MoneyLine label="TOTAL" value={order.FINAL_AMOUNT} total />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead>Product Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length ? (
                order.items.map((item) => (
                  <TableRow key={item.BUSINESS_ORDER_DETAIL_ID}>
                    <TableCell className="font-medium">
                      {item.product_title}
                    </TableCell>
                    <TableCell>{item.ORDER_QUANTITY}</TableCell>
                    <TableCell>
                      {currencyFormatter.format(item.PRODUCT_SELL_PRICE)}
                    </TableCell>
                    <TableCell>
                      {currencyFormatter.format(item.PRODUCT_DISCOUNT)}
                    </TableCell>
                    <TableCell>
                      {currencyFormatter.format(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    No order items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
