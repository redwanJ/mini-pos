'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

interface DeductionSuccessProps {
  productName: string;
  remainingStock: number;
}

export function DeductionSuccess({ productName, remainingStock }: DeductionSuccessProps) {
  const t = useTranslations('scanner');

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t('stockDeducted')}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        {productName}: {remainingStock} remaining
      </p>
    </div>
  );
}
