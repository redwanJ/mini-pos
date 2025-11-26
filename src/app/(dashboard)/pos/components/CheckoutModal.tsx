'use client';

import { useTranslations } from 'next-intl';
import {
  Loader2,
  CreditCard,
  Smartphone,
  Banknote,
  MoreHorizontal,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

const paymentMethods = [
  { id: 'CASH', icon: Banknote, labelKey: 'cash' },
  { id: 'CARD', icon: CreditCard, labelKey: 'card' },
  { id: 'MOBILE', icon: Smartphone, labelKey: 'mobile' },
  { id: 'OTHER', icon: MoreHorizontal, labelKey: 'other' },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  total: number;
  currency: string;
  loading: boolean;
  onCheckout: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  discount,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
  total,
  currency,
  loading,
  onCheckout,
}: CheckoutModalProps) {
  const t = useTranslations('pos');


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('checkout')}>
      <div className="space-y-4">
        <div>
          <label className="label">{t('discountPercent')}</label>
          <input
            type="number"
            value={discount}
            onChange={(e) =>
              onDiscountChange(
                Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
              )
            }
            className="input"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="label">{t('paymentMethod')}</label>
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${paymentMethod === method.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 ring-2 ring-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{t(method.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <>
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>{t('total')}</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={loading}
            className="w-full btn btn-primary py-3 text-base"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('completeSale')
            )}
          </button>
        </>
      </div>
    </Modal>
  );
}
