import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);

    const product = await prisma.product.findFirst({
      where: { id, businessId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 });
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);

    const existingProduct = await prisma.product.findFirst({
      where: { id, businessId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      costPrice,
      salePrice,
      stock,
      lowStockThreshold,
      categoryId,
      newCategory,
      imageUrl,
    } = body;

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(salePrice !== undefined && { salePrice: parseFloat(salePrice) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(lowStockThreshold !== undefined && {
          lowStockThreshold: parseInt(lowStockThreshold),
        }),
        ...((categoryId !== undefined || newCategory) && { categoryId: finalCategoryId || null }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: { category: true },
    });

    // Check for low stock alert
    if (product.stock <= product.lowStockThreshold) {
      const existingAlert = await prisma.lowStockAlert.findFirst({
        where: { productId: product.id, dismissed: false },
      });

      if (!existingAlert) {
        await prisma.lowStockAlert.create({
          data: {
            productId: product.id,
            currentStock: product.stock,
            threshold: product.lowStockThreshold,
          },
        });
      }
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);

    const existingProduct = await prisma.product.findFirst({
      where: { id, businessId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
