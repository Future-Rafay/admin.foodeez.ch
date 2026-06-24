import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "delivered"
  | "rejected";

export type DateRangeFilter = "today" | "last7" | "custom" | "all";

export type OrderItemRow = {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminOrderRow = {
  id: number;
  customerName: string;
  phone: string | null;
  address: string;
  itemsSummary: string;
  items: OrderItemRow[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  orderedAt: string | null;
};

export type OrdersKpis = {
  newPendingCount: number;
  preparingCount: number;
  readyCount: number;
  deliveredTodayCount: number;
  revenueToday: number;
};

export type ListOrdersParams = {
  businessId: number;
  status?: string | null;
  dateRange?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
  page?: number;
};

const PAGE_SIZE = 20;

const STATUS_TO_CODE: Record<OrderStatus, number> = {
  rejected: 0,
  new: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
};

const CODE_TO_STATUS: Record<number, OrderStatus> = {
  0: "rejected",
  1: "new",
  2: "preparing",
  3: "ready",
  4: "delivered",
};

function toNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function parseOrderStatus(value: string | null | undefined) {
  if (!value || value === "all") return null;
  return value in STATUS_TO_CODE ? (value as OrderStatus) : null;
}

function mapOrderStatus(code: number | null | undefined): OrderStatus {
  return CODE_TO_STATUS[Number(code ?? 1)] || "new";
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getDateBounds(
  dateRange: string | null | undefined,
  startDate?: string | null,
  endDate?: string | null
) {
  const now = new Date();

  if (dateRange === "today") {
    return {
      gte: startOfDay(now),
      lte: endOfDay(now),
    };
  }

  if (dateRange === "last7") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);

    return {
      gte: start,
      lte: endOfDay(now),
    };
  }

  if (dateRange === "custom" && startDate && endDate) {
    return {
      gte: startOfDay(new Date(startDate)),
      lte: endOfDay(new Date(endDate)),
    };
  }

  return null;
}

function formatCustomer(firstName?: string | null, lastName?: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "Guest customer";
}

function formatAddress(order: {
  ADDRESS_STREET?: string | null;
  ADDRESS_ZIP?: string | null;
  ADDRESS_TOWN?: string | null;
  ADDRESS_COUNTRY_CODE?: string | null;
}) {
  return [
    order.ADDRESS_STREET,
    [order.ADDRESS_ZIP, order.ADDRESS_TOWN].filter(Boolean).join(" "),
    order.ADDRESS_COUNTRY_CODE,
  ]
    .filter(Boolean)
    .join(", ");
}

async function getVisitorAccountId() {
  const session = await getServerSession(authOptions);
  const id = Number(session?.user?.id);

  if (Number.isFinite(id)) return id;

  if (!session?.user?.email) return null;

  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: session.user.email },
  });

  return user?.VISITORS_ACCOUNT_ID ? Number(user.VISITORS_ACCOUNT_ID) : null;
}

export async function requireOrdersBusinessAccess(businessId: number) {
  const visitorAccountId = await getVisitorAccountId();

  if (!visitorAccountId) {
    throw new Error("Unauthorized");
  }

  const owner = await prisma.business_owner.findFirst({
    where: { VISITORS_ACCOUNT_ID: visitorAccountId },
  });

  if (!owner) {
    throw new Error("Forbidden");
  }

  const access = await prisma.business_owner_2_business.findFirst({
    where: {
      BUSINESS_OWNER_ID: BigInt(owner.BUSINESS_OWNER_ID),
      BUSINESS_ID: BigInt(businessId),
    },
  });

  if (!access) {
    throw new Error("Forbidden");
  }
}

async function buildOrderRows(orders: Awaited<ReturnType<typeof prisma.business_order.findMany>>) {
  const orderIds = orders.map((order) => order.BUSINESS_ORDER_ID);
  const details = orderIds.length
    ? await prisma.business_order_detail.findMany({
        where: { BUSINESS_ORDER_ID: { in: orderIds } },
      })
    : [];
  const productIds = details
    .map((detail) => detail.BUSINESS_PRODUCT_ID)
    .filter((id): id is number => id !== null);
  const products = productIds.length
    ? await prisma.business_product.findMany({
        where: { BUSINESS_PRODUCT_ID: { in: productIds } },
      })
    : [];

  return orders.map<AdminOrderRow>((order) => {
    const orderItems = details.filter(
      (detail) => detail.BUSINESS_ORDER_ID === order.BUSINESS_ORDER_ID
    );
    const items = orderItems.map<OrderItemRow>((detail) => {
      const product = products.find(
        (item) => item.BUSINESS_PRODUCT_ID === detail.BUSINESS_PRODUCT_ID
      );
      const quantity = detail.ORDER_QUANTITY || 0;
      const unitPrice = toNumber(detail.PRODUCT_SELL_PRICE || detail.PRODUCT_PRICE);

      return {
        productId: detail.BUSINESS_PRODUCT_ID,
        productName:
          product?.TITLE ||
          (detail.BUSINESS_PRODUCT_ID
            ? `Product #${detail.BUSINESS_PRODUCT_ID}`
            : "Unknown product"),
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      };
    });

    return {
      id: order.BUSINESS_ORDER_ID,
      customerName: formatCustomer(order.FIRST_NAME, order.LAST_NAME),
      phone: order.PHONE_NUMBER || null,
      address: formatAddress(order),
      itemsSummary: items.length
        ? items
            .slice(0, 2)
            .map((item) => `${item.quantity}x ${item.productName}`)
            .join(", ") + (items.length > 2 ? ` +${items.length - 2} more` : "")
        : "No items",
      items,
      total: toNumber(order.ORDER_FINAL_AMOUNT),
      deliveryFee: toNumber(order.SHIPPING_CHARGES),
      status: mapOrderStatus(order.ORDER_STATUS),
      orderedAt: order.CREATION_DATETIME?.toISOString() || null,
    };
  });
}

async function getOrdersKpis(businessId: number): Promise<OrdersKpis> {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const orders = await prisma.business_order.findMany({
    where: { BUSINESS_ID: businessId },
  });
  const deliveredTodayOrders = orders.filter((order) => {
    if (order.ORDER_STATUS !== STATUS_TO_CODE.delivered) return false;
    const deliveredAt = order.DELIVERY_DATETIME || order.CREATION_DATETIME;
    return Boolean(deliveredAt && deliveredAt >= todayStart && deliveredAt <= todayEnd);
  });

  return {
    newPendingCount: orders.filter(
      (order) => order.ORDER_STATUS === STATUS_TO_CODE.new
    ).length,
    preparingCount: orders.filter(
      (order) => order.ORDER_STATUS === STATUS_TO_CODE.preparing
    ).length,
    readyCount: orders.filter(
      (order) => order.ORDER_STATUS === STATUS_TO_CODE.ready
    ).length,
    deliveredTodayCount: deliveredTodayOrders.length,
    revenueToday: deliveredTodayOrders.reduce(
      (total, order) => total + toNumber(order.ORDER_FINAL_AMOUNT),
      0
    ),
  };
}

export async function listOrders(params: ListOrdersParams) {
  await requireOrdersBusinessAccess(params.businessId);

  const status = parseOrderStatus(params.status);
  const dateBounds = getDateBounds(
    params.dateRange,
    params.startDate,
    params.endDate
  );
  const page = Math.max(1, Number(params.page || 1));
  const search = params.search?.trim();
  const where: Record<string, unknown> = {
    BUSINESS_ID: params.businessId,
  };

  if (status) {
    where.ORDER_STATUS = STATUS_TO_CODE[status];
  }

  if (dateBounds) {
    where.CREATION_DATETIME = dateBounds;
  }

  if (search) {
    const orderNumber = Number(search);
    where.OR = [
      ...(Number.isFinite(orderNumber)
        ? [{ BUSINESS_ORDER_ID: orderNumber }]
        : []),
      { FIRST_NAME: { contains: search } },
      { LAST_NAME: { contains: search } },
      { EMAIL_ADDRESS: { contains: search } },
      { PHONE_NUMBER: { contains: search } },
    ];
  }

  const orderQueryArgs = { // FIXED: Orders table query mismatch
    where, // FIXED: Orders table query mismatch
    orderBy: { CREATION_DATETIME: "desc" as const }, // FIXED: Orders table query mismatch
    skip: (page - 1) * PAGE_SIZE, // FIXED: Orders table query mismatch
    take: PAGE_SIZE, // FIXED: Orders table query mismatch
  }; // FIXED: Orders table query mismatch

  if (process.env.NODE_ENV === "development") { // FIXED: Orders table query mismatch
    console.log("[orders:list] Prisma query args", { // FIXED: Orders table query mismatch
      tableQuery: orderQueryArgs, // FIXED: Orders table query mismatch
      kpiQuery: { where: { BUSINESS_ID: params.businessId } }, // FIXED: Orders table query mismatch
    }); // FIXED: Orders table query mismatch
  } // FIXED: Orders table query mismatch

  const [totalCount, orders, kpis] = await Promise.all([
    prisma.business_order.count({ where }),
    prisma.business_order.findMany(orderQueryArgs), // FIXED: Orders table query mismatch
    getOrdersKpis(params.businessId),
  ]);

  return {
    kpis,
    orders: await buildOrderRows(orders),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    },
  };
}

export function getAllowedNextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "new") return ["preparing", "rejected"];
  if (status === "preparing") return ["ready"];
  if (status === "ready") return ["delivered"];
  return [];
}

export async function updateOrderStatus(
  businessId: number,
  orderId: number,
  nextStatus: OrderStatus
) {
  await requireOrdersBusinessAccess(businessId);

  const order = await prisma.business_order.findFirst({
    where: {
      BUSINESS_ORDER_ID: orderId,
      BUSINESS_ID: businessId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const currentStatus = mapOrderStatus(order.ORDER_STATUS);
  const allowedNextStatuses = getAllowedNextStatuses(currentStatus);

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new Error("Invalid status transition");
  }

  const updatedOrder = await prisma.business_order.update({
    where: { BUSINESS_ORDER_ID: orderId },
    data: {
      ORDER_STATUS: STATUS_TO_CODE[nextStatus],
      DELIVERY_DATETIME:
        nextStatus === "delivered" ? new Date() : order.DELIVERY_DATETIME,
    },
  });

  return (await buildOrderRows([updatedOrder]))[0];
}
