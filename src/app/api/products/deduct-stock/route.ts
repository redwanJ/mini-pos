import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

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
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity },
    });

    // Check for low stock alert
    if (updatedProduct.stock <= updatedProduct.lowStockThreshold) {
      const existingAlert = await prisma.lowStockAlert.findFirst({
        where: { productId: updatedProduct.id, dismissed: false },
      });

      if (!existingAlert) {
        await prisma.lowStockAlert.create({
          data: {
            productId: updatedProduct.id,
            currentStock: updatedProduct.stock,
            threshold: updatedProduct.lowStockThreshold,
          },
        });
      }
    }

    return NextResponse.json({
      product: updatedProduct,
      deducted: quantity,
      newStock: updatedProduct.stock,
    });
  } catch (error) {
    console.error('Deduct stock error:', error);
    return NextResponse.json({ error: 'Failed to deduct stock' }, { status: 500 });
  }
}
