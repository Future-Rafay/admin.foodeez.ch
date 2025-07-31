import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List tags for a business
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = Number(searchParams.get('businessId'));
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }
  const tags = await prisma.business_product_tag.findMany({
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_TAG_ID: 'desc' },
  });
  return NextResponse.json(tags);
}

// POST: Create a new tag
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title } = data;
  if (!businessId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const tag = await prisma.business_product_tag.create({
    data: {
      BUSINESS_ID: businessId,
      TITLE: title,
    },
  });
  return NextResponse.json(tag, { status: 201 });
}

// PUT: Update a tag
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, title } = data;
  if (!id) {
    return NextResponse.json({ error: 'Missing tag id' }, { status: 400 });
  }
  const tag = await prisma.business_product_tag.update({
    where: { BUSINESS_PRODUCT_TAG_ID: id },
    data: { TITLE: title },
  });
  return NextResponse.json(tag);
}

// DELETE: Delete a tag
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing tag id' }, { status: 400 });
  }

  // Start a transaction to handle all the deletions
  await prisma.$transaction([
    // Delete product tag associations
    prisma.business_product_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_TAG_ID: id },
    }),
    // Delete category tag associations
    prisma.business_product_category_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_TAG_ID: id },
    }),
    // Delete the tag itself
    prisma.business_product_tag.delete({
      where: { BUSINESS_PRODUCT_TAG_ID: id },
    }),
  ]);

  return NextResponse.json({ success: true });
}