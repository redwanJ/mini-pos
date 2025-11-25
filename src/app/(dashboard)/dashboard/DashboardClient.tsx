'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { formatCurrency, formatTime } from '@/lib/utils';

interface DashboardData {
  stats: {
    totalProducts: number;
    todaySales: number;
    todayRevenue: number;
    todayProfit: number;
    lowStockCount: number;
  };
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
  }>;
  recentTransactions: Array<{
    id: string;
    total: number;
    itemCount: number;
    staffName: string;
    createdAt: string;
  }>;
  business: {
    name: string;
    currency: string;
  } | null;
}

interface DashboardClientProps {
  data: DashboardData;
  userName: string;
  translations: {
    title: string;
    welcome: string;
    totalProducts: string;
    todaySales: string;
    todayRevenue: string;
    todayProfit: string;
    lowStockAlerts: string;
    recentTransactions: string;
    noTransactions: string;
    viewAll: string;
  };
}

export function DashboardClient({ data, translations: t }: DashboardClientProps) {
  const currency = data.business?.currency || 'ETB';

  return (
    <div>
      <PageHeader title={t.title} subtitle={t.welcome} />

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t.totalProducts}
            value={data.stats.totalProducts}
            icon={Package}
            color="blue"
          />
          <StatCard
            title={t.todaySales}
            value={data.stats.todaySales}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title={t.todayRevenue}
            value={formatCurrency(data.stats.todayRevenue, currency)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title={t.todayProfit}
            value={formatCurrency(data.stats.todayProfit, currency)}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Low Stock Alerts */}
        {data.stats.lowStockCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.lowStockAlerts}
                </h3>
              </div>
              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                {data.stats.lowStockCount}
              </span>
            </div>
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {product.name}
                  </span>
                  <span className="text-sm font-medium text-red-500">
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
            {data.stats.lowStockCount > 3 && (
              <Link
                href="/products"
                className="flex items-center justify-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.viewAll}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t.recentTransactions}
              </h3>
            </div>
            <Link
              href="/reports"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.viewAll}
            </Link>
          </div>

          {data.recentTransactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              {t.noTransactions}
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(transaction.total, currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.itemCount} items • {transaction.staffName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(transaction.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
