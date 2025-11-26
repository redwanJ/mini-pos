'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import { CenterModal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  currency: string;
}

export function ReceiptModal({ isOpen, onClose, total, currency }: ReceiptModalProps) {
  const t = useTranslations('pos');

  return (
    <CenterModal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t('saleComplete')}</h2>
        <p className="text-2xl font-bold text-green-600 mb-4">
          {formatCurrency(total, currency)}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn btn-primary">
            {t('newSale')}
          </button>
        </div>
      </div>
    </CenterModal>
  );
}
