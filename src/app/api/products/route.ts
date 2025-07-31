import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List products for a business
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = Number(searchParams.get('businessId'));
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }
  // First get all products
  const products = await prisma.business_product.findMany({
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_ID: 'desc' },
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
  const productsWithTags = products.map(product => ({
    ...product,
    tags: productTags
      .filter(pt => pt.BUSINESS_PRODUCT_ID === product.BUSINESS_PRODUCT_ID)
      .map(pt => tags.find(t => t.BUSINESS_PRODUCT_TAG_ID === pt.BUSINESS_PRODUCT_TAG_ID))
      .filter(Boolean)
  }));
  return NextResponse.json(productsWithTags);
}

// POST: Create a new product
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title, description, product_price, pic, tag_ids } = data;
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

  // Create product and its tag relationships in a transaction
  const product = await prisma.$transaction(async (tx) => {
    // Create the product
    const newProduct = await tx.business_product.create({
      data: productData,
    });

    // Create tag relationships if tags are provided
    if (tag_ids?.length) {
      await tx.business_product_2_tag.createMany({
        data: tag_ids.map((tagId: number) => ({
          BUSINESS_PRODUCT_ID: newProduct.BUSINESS_PRODUCT_ID,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    // Get the tags for the new product
    const productTags = await tx.business_product_2_tag.findMany({
      where: { BUSINESS_PRODUCT_ID: newProduct.BUSINESS_PRODUCT_ID },
    });

    const tags = await tx.business_product_tag.findMany({
      where: { 
        BUSINESS_PRODUCT_TAG_ID: { 
          in: productTags.map(pt => pt.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null) 
        } 
      },
    });

    // Return the product with its tags
    return {
      ...newProduct,
      tags,
    };
  });

  return NextResponse.json(product, { status: 201 });
}

// PUT: Update a product
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, title, description, product_price, pic, tag_ids, updateImageOnly } = data;
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }
  
  const updateData: any = {};
  
  // If updateImageOnly is true, only update the image
  if (updateImageOnly) {
    updateData.PIC = pic;
  } else {
    updateData.TITLE = title;
    updateData.DESCRIPTION = description;
    updateData.PRODUCT_PRICE = product_price;
    updateData.PIC = pic;
  }

  // Update product and its tag relationships in a transaction
  const product = await prisma.$transaction(async (tx) => {
    // Update the product
    const updatedProduct = await tx.business_product.update({
      where: { BUSINESS_PRODUCT_ID: id },
      data: updateData,
    });

    // Delete existing tag relationships
    await tx.business_product_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_ID: id },
    });

    // Create new tag relationships if tags are provided
    if (tag_ids?.length) {
      await tx.business_product_2_tag.createMany({
        data: tag_ids.map((tagId: number) => ({
          BUSINESS_PRODUCT_ID: id,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    // Get the updated tags
    const productTags = await tx.business_product_2_tag.findMany({
      where: { BUSINESS_PRODUCT_ID: id },
    });

    const tags = await tx.business_product_tag.findMany({
      where: { 
        BUSINESS_PRODUCT_TAG_ID: { 
          in: productTags.map(pt => pt.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null) 
        } 
      },
    });

    // Return the updated product with its tags
    return {
      ...updatedProduct,
      tags,
    };
  });

  return NextResponse.json(product);
}

// DELETE: Delete a product
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }

  // Delete product and its relationships in a transaction
  await prisma.$transaction([
    // Delete tag relationships first
    prisma.business_product_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_ID: id },
    }),
    // Then delete the product
    prisma.business_product.delete({
      where: { BUSINESS_PRODUCT_ID: id },
    }),
  ]);

  return NextResponse.json({ success: true });
} 