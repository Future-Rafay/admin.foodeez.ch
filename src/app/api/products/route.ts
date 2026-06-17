import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { S3Storage } from '@/lib/s3-storage';

const storage = new S3Storage();

// GET: List products for a business
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = Number(searchParams.get('businessId'));
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }
  // Authorization: ensure requester is authenticated and owns this business
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: session.user.email! },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const owner = await prisma.business_owner.findFirst({
    where: { VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID) },
  });
  if (!owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const access = await prisma.business_owner_2_business.findFirst({
    where: { BUSINESS_OWNER_ID: owner.BUSINESS_OWNER_ID, BUSINESS_ID: businessId },
  });
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // First get products (supports optional pagination via ?page=&limit=)
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = pageParam ? Number(pageParam) : 1;
  const limit = limitParam ? Number(limitParam) : 0;
  const findArgs: any = {
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_ID: 'desc' },
  };
  if (limit > 0) {
    findArgs.skip = (page - 1) * limit;
    findArgs.take = limit;
  }
  const products = await prisma.business_product.findMany(findArgs);

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

  // Authorization: ensure requester owns this business
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: session.user.email! },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const owner = await prisma.business_owner.findFirst({
    where: { VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID) },
  });
  if (!owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const access = await prisma.business_owner_2_business.findFirst({
    where: { BUSINESS_OWNER_ID: owner.BUSINESS_OWNER_ID, BUSINESS_ID: businessId },
  });
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
  
  // Authorization: ensure requester owns this product's business
  const existingProduct = await prisma.business_product.findUnique({
    where: { BUSINESS_PRODUCT_ID: id },
  });
  if (!existingProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  const businessId = existingProduct.BUSINESS_ID;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: session.user.email! },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const owner = await prisma.business_owner.findFirst({
    where: { VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID) },
  });
  if (!owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const access = await prisma.business_owner_2_business.findFirst({
    where: { BUSINESS_OWNER_ID: owner.BUSINESS_OWNER_ID, BUSINESS_ID: businessId },
  });
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  if (
    existingProduct.PIC &&
    pic &&
    existingProduct.PIC !== pic
  ) {
    await storage.delete(existingProduct.PIC).catch(console.error);
  }

  // Update product and its tag relationships in a transaction
  const product = await prisma.$transaction(async (tx) => {
    // Update the product
    const updatedProduct = await tx.business_product.update({
      where: { BUSINESS_PRODUCT_ID: id },
      data: updateData,
    });

    // Only update tag relationships if updateImageOnly is false
    if (!updateImageOnly) {
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
  // Authorization: ensure requester owns this product's business
  const existingProduct = await prisma.business_product.findUnique({
    where: { BUSINESS_PRODUCT_ID: id },
  });
  if (!existingProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  const businessId = existingProduct.BUSINESS_ID;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: session.user.email! },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const owner = await prisma.business_owner.findFirst({
    where: { VISITORS_ACCOUNT_ID: Number(user.VISITORS_ACCOUNT_ID) },
  });
  if (!owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const access = await prisma.business_owner_2_business.findFirst({
    where: { BUSINESS_OWNER_ID: owner.BUSINESS_OWNER_ID, BUSINESS_ID: businessId },
  });
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existingProduct.PIC) {
    await storage.delete(existingProduct.PIC).catch(console.error);
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