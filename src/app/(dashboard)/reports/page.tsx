'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, DollarSign, ShoppingCart, BarChart3, Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBusiness } from '@/hooks/useBusiness';
import { formatCurrency, getDateRange, downloadFile } from '@/lib/utils';
import { PeriodSelector, TopProductsList, SalesByDayChart } from './components';

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
  const { currency } = useBusiness();

  const [period, setPeriod] = useState<Period>('daily');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

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

  function handleExport() {
    if (!data) return;

    const headers = ['Date', 'Revenue', 'Transactions'];
    const rows = data.dailySales.map((d) => [d.date, d.revenue, d.transactions]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadFile(csv, `report-${period}.csv`, 'text/csv');
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        action={
          <button
            onClick={handleExport}
            className="btn btn-secondary"
            disabled={!data}
          >
            <Download className="w-4 h-4 mr-1" />
            {t('exportCSV')}
          </button>
        }
      />

      <div className="p-4 space-y-6">
        <PeriodSelector period={period} onChange={setPeriod} />

        {loading ? (
          <LoadingSpinner />
        ) : data ? (
          <>
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

            <TopProductsList products={data.topProducts} currency={currency} />

            <SalesByDayChart dailySales={data.dailySales} currency={currency} />
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">{t('noDataForPeriod')}</p>
        )}
      </div>
    </div>
  );
}
