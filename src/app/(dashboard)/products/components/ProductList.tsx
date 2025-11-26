'use client';

import { useTranslations } from 'next-intl';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProductItem } from './ProductItem';

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

interface ProductListProps {
  products: Product[];
  loading: boolean;
  currency: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onShowQR: (product: Product) => void;
}

export function ProductList({
  products,
  loading,
  currency,
  onEdit,
  onDelete,
  onShowQR,
}: ProductListProps) {
  const t = useTranslations('products');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t('noProducts')}
        description={t('addFirstProduct')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          currency={currency}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
          onShowQR={() => onShowQR(product)}
        />
      ))}
    </div>
  );
}
