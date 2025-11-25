import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

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

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate summary
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      }
    }

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate sales by day
    const salesByDay: Record<string, { date: string; revenue: number; transactions: number }> = {};

    for (const transaction of transactions) {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      if (!salesByDay[dateKey]) {
        salesByDay[dateKey] = {
          date: dateKey,
          revenue: 0,
          transactions: 0,
        };
      }
      salesByDay[dateKey].revenue += transaction.total;
      salesByDay[dateKey].transactions += 1;
    }

    const dailySales = Object.values(salesByDay).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalProfit,
        totalTransactions,
        averageTransaction,
      },
      topProducts,
      dailySales,
      transactions: transactions.map((t) => ({
        id: t.id,
        total: t.total,
        profit: t.profit,
        itemCount: t.items.reduce((sum, i) => sum + i.quantity, 0),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Failed to get reports' }, { status: 500 });
  }
}
