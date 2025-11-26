'use client';

import { useTranslations } from 'next-intl';

type Period = 'daily' | 'weekly' | 'monthly';

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
}

const periods: Period[] = ['daily', 'weekly', 'monthly'];

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const t = useTranslations('reports');

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            period === p
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          {t(p)}
        </button>
      ))}
    </div>
  );
}
