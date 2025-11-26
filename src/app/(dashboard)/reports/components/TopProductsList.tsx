'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface TopProductsListProps {
  products: TopProduct[];
  currency: string;
}

export function TopProductsList({ products, currency }: TopProductsListProps) {
  const t = useTranslations('reports');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        {t('topProducts')}
      </h3>
      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-4">{t('noDataForPeriod')}</p>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500">{product.quantity} sold</p>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(product.revenue, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
