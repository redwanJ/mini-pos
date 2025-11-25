'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Download,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { formatCurrency, getDateRange, downloadFile } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly';

interface ReportData {
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  const [period, setPeriod] = useState<Period>('daily');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [currency, setCurrency] = useState('ETB');

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch('/api/business');
        if (response.ok) {
          const data = await response.json();
          setCurrency(data.business?.currency || 'ETB');
        }
      } catch {
        // Ignore
      }
    }
    fetchBusiness();
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(period);
      const response = await fetch(
        `/api/reports?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleExport(format: 'csv' | 'xlsx') {
    if (!data) return;

    if (format === 'csv') {
      const headers = ['Date', 'Revenue', 'Transactions'];
      const rows = data.dailySales.map((d) => [d.date, d.revenue, d.transactions]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      downloadFile(csv, `report-${period}.csv`, 'text/csv');
    }
  }

  const periods: Array<{ id: Period; labelKey: string }> = [
    { id: 'daily', labelKey: 'daily' },
    { id: 'weekly', labelKey: 'weekly' },
    { id: 'monthly', labelKey: 'monthly' },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        action={
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
            disabled={!data}
          >
            <Download className="w-4 h-4 mr-1" />
            {t('exportCSV')}
          </button>
        }
      />

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                period === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title={t('totalRevenue')}
                value={formatCurrency(data.summary.totalRevenue, currency)}
                icon={DollarSign}
                color="blue"
              />
              <StatCard
                title={t('totalProfit')}
                value={formatCurrency(data.summary.totalProfit, currency)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title={t('totalTransactions')}
                value={data.summary.totalTransactions}
                icon={ShoppingCart}
                color="purple"
              />
              <StatCard
                title={t('averageTransaction')}
                value={formatCurrency(data.summary.averageTransaction, currency)}
                icon={BarChart3}
                color="yellow"
              />
            </div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('topProducts')}
              </h3>
              {data.topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('noDataForPeriod')}
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.quantity} sold
                        </p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Sales by Day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-4"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('salesByDay')}
              </h3>
              {data.dailySales.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('noDataForPeriod')}
                </p>
              ) : (
                <div className="space-y-2">
                  {data.dailySales.map((day) => {
                    const maxRevenue = Math.max(
                      ...data.dailySales.map((d) => d.revenue)
                    );
                    const percentage =
                      maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                    return (
                      <div key={day.date} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(day.date).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(day.revenue, currency)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">
            {t('noDataForPeriod')}
          </p>
        )}
      </div>
    </div>
  );
}
