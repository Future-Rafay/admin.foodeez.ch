import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: List tags for a business
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
  // Support optional pagination via ?page=&limit=
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = pageParam ? Number(pageParam) : 1;
  const limit = limitParam ? Number(limitParam) : 0;
  const findArgs: any = {
    where: { BUSINESS_ID: businessId },
    orderBy: { BUSINESS_PRODUCT_TAG_ID: 'desc' },
  };
  if (limit > 0) {
    findArgs.skip = (page - 1) * limit;
    findArgs.take = limit;
  }
  const tags = await prisma.business_product_tag.findMany(findArgs);
  return NextResponse.json(tags);
}

// POST: Create a new tag
export async function POST(req: Request) {
  const data = await req.json();
  const { businessId, title } = data;
  if (!businessId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
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
  // Authorization: ensure requester owns this tag's business
  const existingTag = await prisma.business_product_tag.findUnique({
    where: { BUSINESS_PRODUCT_TAG_ID: id },
  });
  if (!existingTag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }
  const businessId = existingTag.BUSINESS_ID;
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
  // Authorization: ensure requester owns this tag's business
  const existingTag = await prisma.business_product_tag.findUnique({
    where: { BUSINESS_PRODUCT_TAG_ID: id },
  });
  if (!existingTag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }
  const businessId = existingTag.BUSINESS_ID;
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