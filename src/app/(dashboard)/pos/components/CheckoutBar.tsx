'use client';

import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

interface CheckoutBarProps {
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  onCheckout: () => void;
}

export function CheckoutBar({
  subtotal,
  discount,
  total,
  currency,
  onCheckout,
}: CheckoutBarProps) {
  const t = useTranslations('pos');
  const discountAmount = (subtotal * discount) / 100;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 pb-6 space-y-3 safe-bottom">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{t('subtotal')}</span>
        <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>
            {t('discount')} ({discount}%)
          </span>
          <span>-{formatCurrency(discountAmount, currency)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold">
        <span>{t('total')}</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
      <button onClick={onCheckout} className="w-full btn btn-primary py-3">
        {t('checkout')}
      </button>
    </div>
  );
}
