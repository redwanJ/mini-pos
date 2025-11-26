'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart3, Users, ChevronRight } from 'lucide-react';

export function QuickAccessLinks() {
  const t = useTranslations('settings');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card overflow-hidden"
    >
      <Link
        href="/reports"
        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('reports')}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>
      <div className="border-t border-gray-100 dark:border-gray-700" />
      <Link
        href="/staff"
        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('staffManagement')}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>
    </motion.div>
  );
}
