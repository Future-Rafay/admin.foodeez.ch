import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { S3Storage } from '@/lib/s3-storage';

const storage = new S3Storage();

// GET: List categories for a business
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

  // First get categories (supports optional pagination via ?page=&limit=)
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = pageParam ? Number(pageParam) : 1;
  const limit = limitParam ? Number(limitParam) : 0;
  const findArgs: any = {
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_CATEGORY_ID: 'desc' },
  };
  if (limit > 0) {
    findArgs.skip = (page - 1) * limit;
    findArgs.take = limit;
  }
  const categories = await prisma.business_product_category.findMany(findArgs);

  // Then get all category-tag relationships
  const categoryIds = categories.map(c => c.BUSINESS_PRODUCT_CATEGORY_ID);
  const categoryTags = await prisma.business_product_category_2_tag.findMany({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: { in: categoryIds } },
  });

  // Get all unique tag IDs
  const tagIds = [...new Set(categoryTags.map(ct => ct.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null))];
  const tags = await prisma.business_product_tag.findMany({
    where: { BUSINESS_PRODUCT_TAG_ID: { in: tagIds } },
  });

  // Combine the data
  const categoriesWithTags = categories.map(category => ({
    ...category,
    tags: categoryTags
      .filter(ct => ct.BUSINESS_PRODUCT_CATEGORY_ID === category.BUSINESS_PRODUCT_CATEGORY_ID)
      .map(ct => tags.find(t => t.BUSINESS_PRODUCT_TAG_ID === ct.BUSINESS_PRODUCT_TAG_ID))
      .filter(Boolean)
  }));

  return NextResponse.json(categoriesWithTags);
}

// POST: Create a new category
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title, description, pic, status, tag_ids } = data;
  if (!businessId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Create category and its tag relationships in a transaction
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
  
  const category = await prisma.$transaction(async (tx) => {
    // Create the category
    const newCategory = await tx.business_product_category.create({
      data: {
        BUSINESS_ID: businessId,
        TITLE: title,
        DESCRIPTION: description,
        PIC: pic,
        STATUS: status,
      },
    });

    // Create tag relationships if tags are provided
    if (tag_ids?.length) {
      await tx.business_product_category_2_tag.createMany({
        data: tag_ids.map((tagId: number) => ({
          BUSINESS_PRODUCT_CATEGORY_ID: newCategory.BUSINESS_PRODUCT_CATEGORY_ID,
          BUSINESS_PRODUCT_TAG_ID: tagId,
          CREATION_DATETIME: new Date(),
        })),
      });
    }

    // Get the tags for the new category
    const categoryTags = await tx.business_product_category_2_tag.findMany({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: newCategory.BUSINESS_PRODUCT_CATEGORY_ID },
    });

    const tags = await tx.business_product_tag.findMany({
      where: { 
        BUSINESS_PRODUCT_TAG_ID: { 
          in: categoryTags.map(ct => ct.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null) 
        } 
      },
    });

    // Return the category with its tags
    return {
      ...newCategory,
      tags,
    };
  });

  return NextResponse.json(category, { status: 201 });
}

// PUT: Update a category
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, title, description, pic, status, tag_ids, updateImageOnly } = data;
  if (!id) {
    return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
  }

  // Update category and its tag relationships in a transaction
  // Authorization: ensure requester owns this category's business
  const existingCategory = await prisma.business_product_category.findUnique({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
  });
  if (!existingCategory) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
  const businessId = existingCategory.BUSINESS_ID;
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
  
  const category = await prisma.$transaction(async (tx) => {
    // Prepare update data
    const updateData: any = {};
    
    // If updateImageOnly is true, only update the image
    if (updateImageOnly) {
      updateData.PIC = pic;
    } else {
      updateData.TITLE = title;
      updateData.DESCRIPTION = description;
      updateData.PIC = pic;
      updateData.STATUS = status;
    }

    if (
      existingCategory.PIC &&
      pic &&
      existingCategory.PIC !== pic
    ) {
      await storage.delete(existingCategory.PIC).catch(console.error);
    }
    
    // Update the category
    const updatedCategory = await tx.business_product_category.update({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
      data: updateData,
    });

    // Only update tag relationships if updateImageOnly is false
    if (!updateImageOnly) {
      // Delete existing tag relationships
      await tx.business_product_category_2_tag.deleteMany({
        where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
      });

      // Create new tag relationships if tags are provided
      if (tag_ids?.length) {
        await tx.business_product_category_2_tag.createMany({
          data: tag_ids.map((tagId: number) => ({
            BUSINESS_PRODUCT_CATEGORY_ID: id,
            BUSINESS_PRODUCT_TAG_ID: tagId,
            CREATION_DATETIME: new Date(),
          })),
        });
      }
    }

    // Get the updated tags
    const categoryTags = await tx.business_product_category_2_tag.findMany({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
    });

    const tags = await tx.business_product_tag.findMany({
      where: { 
        BUSINESS_PRODUCT_TAG_ID: { 
          in: categoryTags.map(ct => ct.BUSINESS_PRODUCT_TAG_ID).filter((id): id is number => id !== null) 
        } 
      },
    });

    // Return the updated category with its tags
    return {
      ...updatedCategory,
      tags,
    };
  });

  return NextResponse.json(category);
}

// DELETE: Delete a category
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
  }

  // Delete category and its relationships in a transaction
  // Authorization: ensure requester owns this category's business
  const existingCategory = await prisma.business_product_category.findUnique({
    where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
  });
  if (!existingCategory) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
  const businessId = existingCategory.BUSINESS_ID;
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

  if (existingCategory.PIC) {
    await storage.delete(existingCategory.PIC).catch(console.error);
  }
  
  await prisma.$transaction([
    // Delete tag relationships first
    prisma.business_product_category_2_tag.deleteMany({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
    }),
    // Then delete the category
    prisma.business_product_category.delete({
      where: { BUSINESS_PRODUCT_CATEGORY_ID: id },
    }),
  ]);

  return NextResponse.json({ success: true });
}