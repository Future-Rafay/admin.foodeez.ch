"use server"

import prisma from "@/lib/prisma";
import { business_detail_view_all, business_owner, business_owner_2_business } from "@prisma/client";

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
    console.log(businesses)
    return businesses as business_owner_2_business[];
}

export async function getBusinessesDetails(businessId: number) {
    const businesses = await prisma.business_detail_view_all.findMany({
        where: {
            BUSINESS_ID: businessId,
        },
    });
    return businesses as business_detail_view_all[];
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