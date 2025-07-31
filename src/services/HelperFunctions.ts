"use server"

import { SerializedProduct } from "@/components/products/ProductTable";
import prisma from "@/lib/prisma";
import { business_detail_view_all, business_order, business_owner, business_owner_2_business, business_product } from "@prisma/client";

export async function getBusinessOwner(businessOwnerId: number) {
    const owner = await prisma.business_owner.findFirst({
        where: {
            VISITORS_ACCOUNT_ID: businessOwnerId,
        },
    });
    return owner as business_owner;
}

export async function getBusinessIds(businessOwnerId: number) {
    const businesses = await prisma.business_owner_2_business.findMany({
        where: {
            BUSINESS_OWNER_ID: businessOwnerId,
        },
    });
    return businesses as business_owner_2_business[];
}

export async function getBusinessDetail(businessId: number) {
    const businesses = await prisma.business_detail_view_all.findMany({
        where: {
            BUSINESS_ID: businessId,
        },
    });
    return businesses as business_detail_view_all[];
}

export async function getBusinessProducts(businessId: number) {
    try {
        // First get all products
        const products = await prisma.business_product.findMany({
            where: {
                BUSINESS_ID: businessId,
                STATUS: 1
            },
            orderBy: {
                CREATION_DATETIME: 'desc'
            }
        });

        // Then get all product-tag relationships
        const productIds = products.map(p => p.BUSINESS_PRODUCT_ID);
        const productTags = await prisma.business_product_2_tag.findMany({
            where: { BUSINESS_PRODUCT_ID: { in: productIds } },
        });

        // Get all unique tag IDs
        const tagIds = [...new Set(productTags.map(pt => pt.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null))];
        const tags = await prisma.business_product_tag.findMany({
            where: { BUSINESS_PRODUCT_TAG_ID: { in: tagIds } },
        });

        // Combine the data
        const productsWithTags = products.map(product => {
            const safeProduct = {
                ...product,
                COST_PRICE: product?.COST_PRICE?.toNumber(),
                PRODUCT_PRICE: product?.PRODUCT_PRICE?.toNumber(),
                COMPARE_AS_PRICE: product?.COMPARE_AS_PRICE?.toNumber(),
                tags: productTags
                    .filter(pt => pt.BUSINESS_PRODUCT_ID === product.BUSINESS_PRODUCT_ID)
                    .map(pt => tags.find(t => t.BUSINESS_PRODUCT_TAG_ID === pt.BUSINESS_PRODUCT_TAG_ID))
                    .filter(Boolean)
            };
            return safeProduct;
        });

        return productsWithTags as SerializedProduct[];

    } catch (error) {
        console.error("Error fetching business products:", error);
        return [];
    }
}

export async function getBusinessOrders(businessId: number) {
    try {
        const orders = await prisma.business_order.findMany({
            where: {
                BUSINESS_ID: businessId,
            },
            orderBy: {
                CREATION_DATETIME: 'desc'
            }
        });
        return orders as business_order[];
    } catch (error) {
        console.error("Error fetching business orders:", error);
        return [];
    }
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || '';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN || '';

export async function uploadImagesToStrapi(images: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];
    for (const image of images) {
        const formData = new FormData();
        formData.append('files', image);
        const res = await fetch(`${STRAPI_URL}/api/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            },
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload to Strapi');
        const data = await res.json();
        if (data && data[0] && data[0].url) {
            uploadedUrls.push(data[0].url.startsWith('http') ? data[0].url : `${STRAPI_URL}${data[0].url}`);
        }
    }
    return uploadedUrls;
}

export async function uploadVideoToStrapi(video: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('files', video);
    const res = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload video to Strapi');
    const data = await res.json();
    if (data && data[0] && data[0].url) {
        return data[0].url.startsWith('http') ? data[0].url : `${STRAPI_URL}${data[0].url}`;
    }
    return null;
}