'use client';

import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartItem } from './CartItem';

interface CartItemData {
  id: string;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  quantity: number;
}

interface CartListProps {
  items: CartItemData[];
  currency: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export function CartList({
  items,
  currency,
  onUpdateQuantity,
  onRemove,
}: CartListProps) {
  const t = useTranslations('pos');

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t('emptyCart')}
        description={t('addProducts')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CartItem
          key={item.id}
          id={item.id}
          name={item.name}
          salePrice={item.salePrice}
          quantity={item.quantity}
          stock={item.stock}
          currency={currency}
          onUpdateQuantity={(delta) => onUpdateQuantity(item.id, delta)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </div>
  );
}
