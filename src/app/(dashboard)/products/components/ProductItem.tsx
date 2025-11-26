'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { QrCode, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  qrCode: string;
  imageUrl?: string;
  category?: { id: string; name: string };
}

interface ProductItemProps {
  product: Product;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  onShowQR: () => void;
}

export function ProductItem({
  product,
  currency,
  onEdit,
  onDelete,
  onShowQR,
}: ProductItemProps) {
  const t = useTranslations('products');

  const getStockStatus = () => {
    if (product.stock === 0) return { label: t('outOfStock'), color: 'red' };
    if (product.stock <= product.lowStockThreshold)
      return { label: t('lowStock'), color: 'yellow' };
    return { label: t('inStock'), color: 'green' };
  };

  const stockStatus = getStockStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(product.salePrice, currency)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                stockStatus.color === 'green'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : stockStatus.color === 'yellow'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {stockStatus.label}: {product.stock}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowQR}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
