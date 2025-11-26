'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Package, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
}

interface ProductInfoCardProps {
  product: Product;
  currency: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onCancel: () => void;
  onDeduct: () => void;
  loading: boolean;
}

export function ProductInfoCard({
  product,
  currency,
  quantity,
  onQuantityChange,
  onCancel,
  onDeduct,
  loading,
}: ProductInfoCardProps) {
  const t = useTranslations('scanner');
  const tCommon = useTranslations('common');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card p-4"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(product.salePrice, currency)} • Stock: {product.stock}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-700 dark:text-gray-300">{t('quantity')}</span>
        <QuantitySelector
          value={quantity}
          onChange={onQuantityChange}
          min={1}
          max={product.stock}
          size="lg"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 btn btn-secondary py-3">
          {tCommon('cancel')}
        </button>
        <button
          onClick={onDeduct}
          disabled={loading || product.stock < quantity}
          className="flex-1 btn btn-primary py-3"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('deductStock')
          )}
        </button>
      </div>
    </motion.div>
  );
}
