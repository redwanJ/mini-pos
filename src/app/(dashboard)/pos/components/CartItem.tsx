'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CartItemProps {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  stock: number;
  currency: string;
  onUpdateQuantity: (delta: number) => void;
  onRemove: () => void;
}

export function CartItem({
  name,
  salePrice,
  quantity,
  stock,
  currency,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card p-3 flex items-center gap-3"
    >
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500">{formatCurrency(salePrice, currency)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(-1)}
          className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <button
          onClick={() => onUpdateQuantity(1)}
          className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
          disabled={quantity >= stock}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
