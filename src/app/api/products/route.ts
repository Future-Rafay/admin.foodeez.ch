import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List products for a business
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = Number(searchParams.get('businessId'));
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }
  const products = await prisma.business_product.findMany({
    where: { BUSINESS_ID: businessId },
    include: {
      category: {
        select: {
          BUSINESS_PRODUCT_CATEGORY_ID: true,
          TITLE: true,
          DESCRIPTION: true,
        }
      }
    },
    orderBy: { BUSINESS_PRODUCT_ID: 'desc' },
  });
  return NextResponse.json(products);
}

// POST: Create a new product
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title, description, product_price, pic, category_id } = data;
  if (!businessId || !title || !product_price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const productData: any = {
    BUSINESS_ID: businessId,
    TITLE: title,
    DESCRIPTION: description,
    PRODUCT_PRICE: product_price,
    PIC: pic,
  };

  // Add category relationship if provided
  if (category_id) {
    productData.BUSINESS_PRODUCT_CATEGORY_ID = category_id;
  }

  const product = await prisma.business_product.create({
    data: productData,
    include: {
      category: {
        select: {
          BUSINESS_PRODUCT_CATEGORY_ID: true,
          TITLE: true,
          DESCRIPTION: true,
        }
      }
    },
  });
  return NextResponse.json(product, { status: 201 });
}

// PUT: Update a product
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, title, description, product_price, pic, category_id } = data;
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }
  
  const updateData: any = {
    TITLE: title,
    DESCRIPTION: description,
    PRODUCT_PRICE: product_price,
    PIC: pic,
  };

  // Update category relationship if provided
  if (category_id !== undefined) {
    updateData.BUSINESS_PRODUCT_CATEGORY_ID = category_id || null;
  }

  const product = await prisma.business_product.update({
    where: { BUSINESS_PRODUCT_ID: id },
    data: updateData,
    include: {
      category: {
        select: {
          BUSINESS_PRODUCT_CATEGORY_ID: true,
          TITLE: true,
          DESCRIPTION: true,
        }
      }
    },
  });
  return NextResponse.json(product);
}

// DELETE: Delete a product
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }
  await prisma.business_product.delete({
    where: { BUSINESS_PRODUCT_ID: id },
  });
  return NextResponse.json({ success: true });
} 