import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List categories for a business
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = Number(searchParams.get('businessId'));
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }
  const categories = await prisma.business_product_category.findMany({
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_CATEGORY_ID: 'desc' },
  });
  return NextResponse.json(categories);
}

// POST: Create a new category
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title, description, pic } = data;
  if (!businessId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const category = await prisma.business_product_category.create({
    data: {
      BUSINESS_ID: businessId,
      TITLE: title,
      DESCRIPTION: description,
      PIC: pic,
      STATUS: 1,
    },
  });
  return NextResponse.json(category, { status: 201 });
}

// PUT: Update a category
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, title, description, pic, status } = data;
  if (!id) {
    return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
  }
  const category = await prisma.business_product_category.update({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
    data: {
      TITLE: title,
      DESCRIPTION: description,
      PIC: pic,
      STATUS: status,
    },
  });
  return NextResponse.json(category);
}

// DELETE: Delete a category
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
  }
  await prisma.business_product_category.delete({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
  });
  return NextResponse.json({ success: true });
} 