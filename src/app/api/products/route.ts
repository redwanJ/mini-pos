import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// GET all products
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const products = await prisma.product.findMany({
      where: {
        businessId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { qrCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { categoryId: category }),
      },
      include: {
        category: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to get products' }, { status: 500 });
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      costPrice,
      salePrice,
      stock = 0,
      lowStockThreshold = 5,
      categoryId,
      newCategory,
      imageUrl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (costPrice === undefined || salePrice === undefined) {
      return NextResponse.json({ error: 'Prices are required' }, { status: 400 });
    }

    // Handle category creation if newCategory is provided
    let finalCategoryId = categoryId;
    if (newCategory?.trim()) {
      // Check if category already exists
      let category = await prisma.category.findFirst({
        where: {
          businessId,
          name: newCategory.trim(),
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: newCategory.trim(),
            businessId,
          },
        });
      }
      finalCategoryId = category.id;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        costPrice: parseFloat(costPrice),
        salePrice: parseFloat(salePrice),
        stock: parseInt(stock),
        lowStockThreshold: parseInt(lowStockThreshold),
        categoryId: finalCategoryId || null,
        imageUrl,
        businessId,
      },
      include: {
        category: true,
      },
    });

    // Check for low stock alert
    if (product.stock <= product.lowStockThreshold) {
      await prisma.lowStockAlert.create({
        data: {
          productId: product.id,
          currentStock: product.stock,
          threshold: product.lowStockThreshold,
        },
      });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
