import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// Helper to convert BigInt to string for JSON serialization
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// GET all transactions
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ transactions: serializeBigInt(transactions) });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get transactions' },
      { status: 500 }
    );
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const body = await request.json();
    const {
      items,
      discount = 0,
      paymentMethod = 'CASH',
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    let totalProfit = 0;
    const transactionItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      total: number;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, businessId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = product.salePrice * item.quantity;
      const itemProfit = (product.salePrice - product.costPrice) * item.quantity;

      subtotal += itemTotal;
      totalProfit += itemProfit;

      transactionItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        total: itemTotal,
      });
    }

    // Get business for tax rate
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * (business?.taxRate || 0)) / 100;
    const total = subtotal - discountAmount + taxAmount;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        staffId: userId,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        profit: totalProfit - discountAmount,
        paymentMethod,
        notes,
        items: {
          create: transactionItems,
        },
      },
      include: {
        items: true,
        staff: true,
      },
    });

    // Update stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Check for low stock alert
      const updatedProduct = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (updatedProduct && updatedProduct.stock <= updatedProduct.lowStockThreshold) {
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
    }

    return NextResponse.json({ transaction: serializeBigInt(transaction) });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
