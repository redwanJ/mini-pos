'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';

export function AboutSection() {
  const t = useTranslations('settings');

  return (
    <Card delay={0.3}>
      <CardHeader icon={Info} iconColor="text-purple-600" title={t('about')} />

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">Mini POS - Smart Inventory & QR POS System</p>
        <p>{t('version')}: 2.0.0</p>
      </div>
    </Card>
  );
}
