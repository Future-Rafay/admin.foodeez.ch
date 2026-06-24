import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export type EntityStatus = "active" | "inactive";

export type MenuTagRow = {
  id: number;
  title: string;
  status: EntityStatus;
  productCount: number;
  categoryCount: number;
};

export type MenuTagOption = {
  id: number;
  title: string;
  status: EntityStatus;
};

export type MenuCategoryRow = {
  id: number;
  title: string;
  description: string | null;
  pic: string | null;
  status: EntityStatus;
  tagIds: number[];
  tags: MenuTagOption[];
  productCount: number;
};

export type MenuProductRow = {
  id: number;
  title: string;
  description: string | null;
  productPrice: number;
  pic: string | null;
  status: EntityStatus;
  stock: number;
  categoryId: number | null;
  categoryName: string;
  tagIds: number[];
  tags: MenuTagOption[];
};

export type PaginatedMenuProducts = {
  products: MenuProductRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

const DELETED_STATUS = -1;

function toNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function mapStatus(status?: number | null): EntityStatus {
  return status === 1 ? "active" : "inactive";
}

function statusCode(status?: string | null) {
  if (status === "active") return 1;
  if (status === "inactive") return 0;
  return null;
}

function uniqueIds(values: unknown) {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function containsTag(tagIds: number[], expectedIds: number[]) {
  return tagIds.some((tagId) => expectedIds.includes(tagId));
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

export async function requireMenuBusinessAccess(businessId: number) {
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

async function getActiveTagsForBusiness(businessId: number) {
  return prisma.business_product_tag.findMany({
    where: {
      BUSINESS_ID: businessId,
      STATUS: { not: DELETED_STATUS },
    },
    orderBy: { TITLE: "asc" },
  });
}

async function assertTagsBelongToBusiness(businessId: number, tagIds: number[]) {
  if (!tagIds.length) return;

  const count = await prisma.business_product_tag.count({
    where: {
      BUSINESS_ID: businessId,
      BUSINESS_PRODUCT_TAG_ID: { in: tagIds },
      STATUS: { not: DELETED_STATUS },
    },
  });

  if (count !== tagIds.length) {
    throw new Error("One or more tags are invalid.");
  }
}

async function getCategoryTagIds(categoryId: number) {
  const links = await prisma.business_product_category_2_tag.findMany({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: categoryId },
  });

  return links
    .map((link) => link.BUSINESS_PRODUCT_TAG_ID)
    .filter((id): id is number => id !== null);
}

async function getOwnedCategory(businessId: number, categoryId: number) {
  const category = await prisma.business_product_category.findFirst({
    where: {
      BUSINESS_PRODUCT_CATEGORY_ID: categoryId,
      BUSINESS_ID: businessId,
      STATUS: { not: DELETED_STATUS },
    },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  return category;
}

async function getOwnedProduct(businessId: number, productId: number) {
  const product = await prisma.business_product.findFirst({
    where: {
      BUSINESS_PRODUCT_ID: productId,
      BUSINESS_ID: businessId,
      STATUS: { not: DELETED_STATUS },
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
}

async function getOwnedTag(businessId: number, tagId: number) {
  const tag = await prisma.business_product_tag.findFirst({
    where: {
      BUSINESS_PRODUCT_TAG_ID: tagId,
      BUSINESS_ID: businessId,
      STATUS: { not: DELETED_STATUS },
    },
  });

  if (!tag) {
    throw new Error("Tag not found.");
  }

  return tag;
}

export async function listMenuTags(businessId: number): Promise<MenuTagRow[]> {
  await requireMenuBusinessAccess(businessId);

  const [tags, productLinks, categoryLinks, products, categories] =
    await Promise.all([
      getActiveTagsForBusiness(businessId),
      prisma.business_product_2_tag.findMany(),
      prisma.business_product_category_2_tag.findMany(),
      prisma.business_product.findMany({
        where: {
          BUSINESS_ID: businessId,
          STATUS: { not: DELETED_STATUS },
        },
        select: { BUSINESS_PRODUCT_ID: true },
      }),
      prisma.business_product_category.findMany({
        where: {
          BUSINESS_ID: businessId,
          STATUS: { not: DELETED_STATUS },
        },
        select: { BUSINESS_PRODUCT_CATEGORY_ID: true },
      }),
    ]);
  const productIds = new Set(products.map((product) => product.BUSINESS_PRODUCT_ID));
  const categoryIds = new Set(
    categories.map((category) => category.BUSINESS_PRODUCT_CATEGORY_ID)
  );

  return tags.map((tag) => ({
    id: tag.BUSINESS_PRODUCT_TAG_ID,
    title: tag.TITLE || `Tag #${tag.BUSINESS_PRODUCT_TAG_ID}`,
    status: mapStatus(tag.STATUS),
    productCount: productLinks.filter(
      (link) =>
        link.BUSINESS_PRODUCT_TAG_ID === tag.BUSINESS_PRODUCT_TAG_ID &&
        link.BUSINESS_PRODUCT_ID !== null &&
        productIds.has(link.BUSINESS_PRODUCT_ID)
    ).length,
    categoryCount: categoryLinks.filter(
      (link) =>
        link.BUSINESS_PRODUCT_TAG_ID === tag.BUSINESS_PRODUCT_TAG_ID &&
        link.BUSINESS_PRODUCT_CATEGORY_ID !== null &&
        categoryIds.has(link.BUSINESS_PRODUCT_CATEGORY_ID)
    ).length,
  }));
}

export async function createMenuTag(businessId: number, title: unknown) {
  await requireMenuBusinessAccess(businessId);

  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) {
    throw new Error("Tag name is required.");
  }

  if (normalizedTitle.length > 45) {
    throw new Error("Tag name must be at most 45 characters.");
  }

  const tag = await prisma.business_product_tag.create({
    data: {
      BUSINESS_ID: businessId,
      TITLE: normalizedTitle,
      STATUS: 1,
      CREATION_DATETIME: new Date(),
    },
  });

  return {
    id: tag.BUSINESS_PRODUCT_TAG_ID,
    title: tag.TITLE || normalizedTitle,
    status: mapStatus(tag.STATUS),
    productCount: 0,
    categoryCount: 0,
  } satisfies MenuTagRow;
}

export async function updateMenuTag(
  businessId: number,
  tagId: number,
  values: { title?: unknown; status?: unknown }
) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedTag(businessId, tagId);

  const data: { TITLE?: string; STATUS?: number } = {};
  if (values.title !== undefined) {
    const title = String(values.title || "").trim();
    if (!title) throw new Error("Tag name is required.");
    if (title.length > 45) {
      throw new Error("Tag name must be at most 45 characters.");
    }
    data.TITLE = title;
  }

  const nextStatus = statusCode(String(values.status || ""));
  if (nextStatus !== null) {
    data.STATUS = nextStatus;
  }

  const tag = await prisma.business_product_tag.update({
    where: { BUSINESS_PRODUCT_TAG_ID: tagId },
    data,
  });

  return {
    id: tag.BUSINESS_PRODUCT_TAG_ID,
    title: tag.TITLE || `Tag #${tag.BUSINESS_PRODUCT_TAG_ID}`,
    status: mapStatus(tag.STATUS),
    productCount: 0,
    categoryCount: 0,
  } satisfies MenuTagRow;
}

export async function deleteMenuTag(businessId: number, tagId: number) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedTag(businessId, tagId);

  await prisma.$transaction([
    prisma.business_product_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_TAG_ID: tagId },
    }),
    prisma.business_product_category_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_TAG_ID: tagId },
    }),
    prisma.business_product_tag.update({
      where: { BUSINESS_PRODUCT_TAG_ID: tagId },
      data: { STATUS: DELETED_STATUS },
    }),
  ]);
}

export async function listMenuCategories(
  businessId: number
): Promise<MenuCategoryRow[]> {
  await requireMenuBusinessAccess(businessId);

  const [categories, tags, categoryLinks, productLinks, products] =
    await Promise.all([
      prisma.business_product_category.findMany({
        where: {
          BUSINESS_ID: businessId,
          STATUS: { not: DELETED_STATUS },
        },
        orderBy: { BUSINESS_PRODUCT_CATEGORY_ID: "desc" },
      }),
      getActiveTagsForBusiness(businessId),
      prisma.business_product_category_2_tag.findMany(),
      prisma.business_product_2_tag.findMany(),
      prisma.business_product.findMany({
        where: {
          BUSINESS_ID: businessId,
          STATUS: { not: DELETED_STATUS },
        },
        select: { BUSINESS_PRODUCT_ID: true },
      }),
    ]);
  const productIds = new Set(products.map((product) => product.BUSINESS_PRODUCT_ID));

  return categories.map((category) => {
    const tagIds = categoryLinks
      .filter(
        (link) =>
          link.BUSINESS_PRODUCT_CATEGORY_ID ===
          category.BUSINESS_PRODUCT_CATEGORY_ID
      )
      .map((link) => link.BUSINESS_PRODUCT_TAG_ID)
      .filter((id): id is number => id !== null);
    const categoryTags = tags
      .filter((tag) => tagIds.includes(tag.BUSINESS_PRODUCT_TAG_ID))
      .map<MenuTagOption>((tag) => ({
        id: tag.BUSINESS_PRODUCT_TAG_ID,
        title: tag.TITLE || `Tag #${tag.BUSINESS_PRODUCT_TAG_ID}`,
        status: mapStatus(tag.STATUS),
      }));
    const productCount = products.filter((product) => {
      const currentTagIds = productLinks
        .filter((link) => link.BUSINESS_PRODUCT_ID === product.BUSINESS_PRODUCT_ID)
        .map((link) => link.BUSINESS_PRODUCT_TAG_ID)
        .filter((id): id is number => id !== null);

      return containsTag(currentTagIds, tagIds) && productIds.has(product.BUSINESS_PRODUCT_ID);
    }).length;

    return {
      id: category.BUSINESS_PRODUCT_CATEGORY_ID,
      title: category.TITLE || `Category #${category.BUSINESS_PRODUCT_CATEGORY_ID}`,
      description: category.DESCRIPTION,
      pic: category.PIC,
      status: mapStatus(category.STATUS),
      tagIds,
      tags: categoryTags,
      productCount,
    };
  });
}

export async function createMenuCategory(
  businessId: number,
  values: {
    title?: unknown;
    description?: unknown;
    pic?: unknown;
    status?: unknown;
    tag_ids?: unknown;
  }
) {
  await requireMenuBusinessAccess(businessId);

  const title = String(values.title || "").trim();
  if (!title) throw new Error("Category name is required.");
  if (title.length > 45) throw new Error("Category name must be at most 45 characters.");

  const tagIds = uniqueIds(values.tag_ids);
  await assertTagsBelongToBusiness(businessId, tagIds);

  const status = statusCode(String(values.status || "active"));
  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.business_product_category.create({
      data: {
        BUSINESS_ID: businessId,
        TITLE: title,
        DESCRIPTION: String(values.description || "").trim() || null,
        PIC: String(values.pic || "").trim() || null,
        STATUS: status ?? 1,
        CREATION_DATETIME: new Date(),
      },
    });

    if (tagIds.length) {
      await tx.business_product_category_2_tag.createMany({
        data: tagIds.map((tagId) => ({
          BUSINESS_PRODUCT_CATEGORY_ID: created.BUSINESS_PRODUCT_CATEGORY_ID,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    return created;
  });

  return category;
}

export async function updateMenuCategory(
  businessId: number,
  categoryId: number,
  values: {
    title?: unknown;
    description?: unknown;
    pic?: unknown;
    status?: unknown;
    tag_ids?: unknown;
  }
) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedCategory(businessId, categoryId);

  const title = String(values.title || "").trim();
  if (!title) throw new Error("Category name is required.");
  if (title.length > 45) throw new Error("Category name must be at most 45 characters.");

  const tagIds = uniqueIds(values.tag_ids);
  await assertTagsBelongToBusiness(businessId, tagIds);
  const nextStatus = statusCode(String(values.status || ""));

  return prisma.$transaction(async (tx) => {
    const updated = await tx.business_product_category.update({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: categoryId },
      data: {
        TITLE: title,
        DESCRIPTION: String(values.description || "").trim() || null,
        PIC: String(values.pic || "").trim() || null,
        ...(nextStatus !== null ? { STATUS: nextStatus } : {}),
      },
    });

    await tx.business_product_category_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: categoryId },
    });

    if (tagIds.length) {
      await tx.business_product_category_2_tag.createMany({
        data: tagIds.map((tagId) => ({
          BUSINESS_PRODUCT_CATEGORY_ID: categoryId,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    return updated;
  });
}

export async function deleteMenuCategory(businessId: number, categoryId: number) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedCategory(businessId, categoryId);

  await prisma.$transaction([
    prisma.business_product_category_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: categoryId },
    }),
    prisma.business_product_category.update({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: categoryId },
      data: { STATUS: DELETED_STATUS },
    }),
  ]);
}

export async function listMenuProducts({
  businessId,
  search,
  categoryId,
  status,
  page,
  pageSize,
}: {
  businessId: number;
  search?: string | null;
  categoryId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedMenuProducts> {
  await requireMenuBusinessAccess(businessId);

  const pageNumber = parsePositiveInt(page, 1);
  const size = Math.min(parsePositiveInt(pageSize, 20), 100);
  const searchText = search?.trim();
  const nextStatus = statusCode(status);
  const where: Record<string, unknown> = {
    BUSINESS_ID: businessId,
    STATUS: { not: DELETED_STATUS },
  };

  if (nextStatus !== null) {
    where.STATUS = nextStatus;
  }

  if (searchText) {
    where.OR = [
      { TITLE: { contains: searchText } },
      { DESCRIPTION: { contains: searchText } },
    ];
  }

  const [products, categories, tags, productLinks, categoryLinks] =
    await Promise.all([
      prisma.business_product.findMany({
        where,
        orderBy: { BUSINESS_PRODUCT_ID: "desc" },
      }),
      prisma.business_product_category.findMany({
        where: {
          BUSINESS_ID: businessId,
          STATUS: { not: DELETED_STATUS },
        },
        orderBy: { TITLE: "asc" },
      }),
      getActiveTagsForBusiness(businessId),
      prisma.business_product_2_tag.findMany(),
      prisma.business_product_category_2_tag.findMany(),
    ]);
  const requestedCategoryId = Number(categoryId);

  const rows = products.map<MenuProductRow>((product) => {
    const tagIds = productLinks
      .filter((link) => link.BUSINESS_PRODUCT_ID === product.BUSINESS_PRODUCT_ID)
      .map((link) => link.BUSINESS_PRODUCT_TAG_ID)
      .filter((id): id is number => id !== null);
    const matchedCategory = categories.find((category) => {
      const categoryTagIds = categoryLinks
        .filter(
          (link) =>
            link.BUSINESS_PRODUCT_CATEGORY_ID ===
            category.BUSINESS_PRODUCT_CATEGORY_ID
        )
        .map((link) => link.BUSINESS_PRODUCT_TAG_ID)
        .filter((id): id is number => id !== null);

      return containsTag(tagIds, categoryTagIds);
    });

    return {
      id: product.BUSINESS_PRODUCT_ID,
      title: product.TITLE,
      description: product.DESCRIPTION,
      productPrice: toNumber(product.PRODUCT_PRICE),
      pic: product.PIC,
      status: mapStatus(product.STATUS),
      stock: product.INVENTORY_AVAILABLE ?? product.INVENTORY_ON_HAND ?? 0,
      categoryId: matchedCategory?.BUSINESS_PRODUCT_CATEGORY_ID || null,
      categoryName: matchedCategory?.TITLE || "Uncategorized",
      tagIds,
      tags: tags
        .filter((tag) => tagIds.includes(tag.BUSINESS_PRODUCT_TAG_ID))
        .map((tag) => ({
          id: tag.BUSINESS_PRODUCT_TAG_ID,
          title: tag.TITLE || `Tag #${tag.BUSINESS_PRODUCT_TAG_ID}`,
          status: mapStatus(tag.STATUS),
        })),
    };
  });
  const categoryFilteredRows =
    Number.isFinite(requestedCategoryId) && requestedCategoryId > 0
      ? rows.filter((row) => row.categoryId === requestedCategoryId)
      : rows;
  const totalCount = categoryFilteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  return {
    products: categoryFilteredRows.slice((pageNumber - 1) * size, pageNumber * size),
    pagination: {
      page: pageNumber,
      pageSize: size,
      totalCount,
      totalPages,
    },
  };
}

export async function createMenuProduct(
  businessId: number,
  values: {
    title?: unknown;
    description?: unknown;
    product_price?: unknown;
    pic?: unknown;
    tag_ids?: unknown;
    categoryId?: unknown;
  }
) {
  await requireMenuBusinessAccess(businessId);

  const title = String(values.title || "").trim();
  const price = String(values.product_price || "").trim();
  if (!title || !price) throw new Error("Product name and price are required.");
  if (title.length > 100) throw new Error("Product name must be at most 100 characters.");
  if (!Number.isFinite(Number(price))) throw new Error("Product price must be valid.");

  const categoryId = Number(values.categoryId);
  const explicitTagIds = uniqueIds(values.tag_ids);
  const categoryTagIds =
    Number.isInteger(categoryId) && categoryId > 0
      ? await getCategoryTagIds((await getOwnedCategory(businessId, categoryId)).BUSINESS_PRODUCT_CATEGORY_ID)
      : [];
  const tagIds = Array.from(new Set([...explicitTagIds, ...categoryTagIds]));
  await assertTagsBelongToBusiness(businessId, tagIds);

  return prisma.$transaction(async (tx) => {
    const product = await tx.business_product.create({
      data: {
        BUSINESS_ID: businessId,
        TITLE: title,
        DESCRIPTION: String(values.description || "").trim() || null,
        PRODUCT_PRICE: price,
        PIC: String(values.pic || "").trim() || null,
        STATUS: 1,
        CREATION_DATETIME: new Date(),
      },
    });

    if (tagIds.length) {
      await tx.business_product_2_tag.createMany({
        data: tagIds.map((tagId) => ({
          BUSINESS_PRODUCT_ID: product.BUSINESS_PRODUCT_ID,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    return product;
  });
}

export async function updateMenuProduct(
  businessId: number,
  productId: number,
  values: {
    title?: unknown;
    description?: unknown;
    product_price?: unknown;
    pic?: unknown;
    status?: unknown;
    tag_ids?: unknown;
    categoryId?: unknown;
  }
) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedProduct(businessId, productId);

  const title = String(values.title || "").trim();
  const price = String(values.product_price || "").trim();
  if (!title || !price) throw new Error("Product name and price are required.");
  if (title.length > 100) throw new Error("Product name must be at most 100 characters.");
  if (!Number.isFinite(Number(price))) throw new Error("Product price must be valid.");

  const categoryId = Number(values.categoryId);
  const explicitTagIds = uniqueIds(values.tag_ids);
  const categoryTagIds =
    Number.isInteger(categoryId) && categoryId > 0
      ? await getCategoryTagIds((await getOwnedCategory(businessId, categoryId)).BUSINESS_PRODUCT_CATEGORY_ID)
      : [];
  const tagIds = Array.from(new Set([...explicitTagIds, ...categoryTagIds]));
  await assertTagsBelongToBusiness(businessId, tagIds);
  const nextStatus = statusCode(String(values.status || ""));

  return prisma.$transaction(async (tx) => {
    const product = await tx.business_product.update({
      where: { BUSINESS_PRODUCT_ID: productId },
      data: {
        TITLE: title,
        DESCRIPTION: String(values.description || "").trim() || null,
        PRODUCT_PRICE: price,
        PIC: String(values.pic || "").trim() || null,
        ...(nextStatus !== null ? { STATUS: nextStatus } : {}),
      },
    });

    await tx.business_product_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_ID: productId },
    });

    if (tagIds.length) {
      await tx.business_product_2_tag.createMany({
        data: tagIds.map((tagId) => ({
          BUSINESS_PRODUCT_ID: productId,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    return product;
  });
}

export async function updateMenuProductStatus(
  businessId: number,
  productId: number,
  status: string
) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedProduct(businessId, productId);

  const nextStatus = statusCode(status);
  if (nextStatus === null) throw new Error("Invalid product status.");

  return prisma.business_product.update({
    where: { BUSINESS_PRODUCT_ID: productId },
    data: { STATUS: nextStatus },
  });
}

export async function deleteMenuProduct(businessId: number, productId: number) {
  await requireMenuBusinessAccess(businessId);
  await getOwnedProduct(businessId, productId);

  await prisma.business_product.update({
    where: { BUSINESS_PRODUCT_ID: productId },
    data: { STATUS: DELETED_STATUS },
  });
}
