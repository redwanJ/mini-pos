'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface DailySale {
  date: string;
  revenue: number;
  transactions: number;
}

interface SalesByDayChartProps {
  dailySales: DailySale[];
  currency: string;
}

export function SalesByDayChart({ dailySales, currency }: SalesByDayChartProps) {
  const t = useTranslations('reports');

  const maxRevenue = Math.max(...dailySales.map((d) => d.revenue), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card p-4"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        {t('salesByDay')}
      </h3>
      {dailySales.length === 0 ? (
        <p className="text-center text-gray-500 py-4">{t('noDataForPeriod')}</p>
      ) : (
        <div className="space-y-2">
          {dailySales.map((day) => {
            const percentage = (day.revenue / maxRevenue) * 100;

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
  );
}
