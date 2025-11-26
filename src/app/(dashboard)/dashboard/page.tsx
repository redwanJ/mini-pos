import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/db';
import { DashboardClient } from './DashboardClient';

async function getDashboardData(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const productCount = await prisma.product.count({ where: { businessId } });

  const todayTransactions = await prisma.transaction.findMany({
    where: {
      businessId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const lowStockProducts = await prisma.product.findMany({
    where: {
      businessId,
      stock: {
        lte: prisma.product.fields.lowStockThreshold,
      },
    },
    take: 10,
  });

  const recentTransactions = await prisma.transaction.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      items: true,
      staff: true,
    },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const todayProfit = todayTransactions.reduce((sum, t) => sum + t.profit, 0);

  return {
    stats: {
      totalProducts: productCount,
      todaySales: todayTransactions.length,
      todayRevenue,
      todayProfit,
      lowStockCount: lowStockProducts.length,
    },
    lowStockProducts,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      total: t.total,
      itemCount: t.items.reduce((sum, item) => sum + item.quantity, 0),
      staffName: t.staff?.firstName || 'Unknown',
      createdAt: t.createdAt.toISOString(),
    })),
    business: business
      ? {
          name: business.name,
          currency: business.currency,
        }
      : null,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return <div>Unauthorized</div>;
  }

  const { userId, businessId } = JSON.parse(sessionCookie.value);

  if (!businessId) {
    return <div>No business found</div>;
  }

  const t = await getTranslations('dashboard');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const data = await getDashboardData(businessId);

  return (
    <DashboardClient
      data={data}
      userName={user?.firstName || 'User'}
      translations={{
        title: t('title'),
        welcome: t('welcome', { name: user?.firstName || 'User' }),
        totalProducts: t('totalProducts'),
        todaySales: t('todaySales'),
        todayRevenue: t('todayRevenue'),
        todayProfit: t('todayProfit'),
        lowStockAlerts: t('lowStockAlerts'),
        recentTransactions: t('recentTransactions'),
        noTransactions: t('noTransactions'),
        viewAll: t('viewAll'),
      }}
    />
  );
}
