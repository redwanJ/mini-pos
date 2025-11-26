'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onSelectProduct: (product: Product) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  currency,
  onSelectProduct,
}: SearchModalProps) {
  const t = useTranslations('pos');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  const searchProducts = useCallback(async () => {
    if (!search.trim()) {
      setProducts([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(search)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch {
      // Ignore
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchProducts]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setProducts([]);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchProducts')}
                  className="input pl-10"
                  autoFocus
                />
              </div>
              <button onClick={onClose}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-gray-500">
                    {formatCurrency(product.salePrice, currency)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
