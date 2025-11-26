'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface PendingStepProps {
  businessName: string;
  onCreateNew: () => void;
}

export function PendingStep({ businessName, onCreateNew }: PendingStepProps) {
  const t = useTranslations('onboarding');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
        <Users className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('pendingRequest')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {t('pendingRequestDesc', { businessName })}
        </p>
      </div>

      <button onClick={onCreateNew} className="btn btn-secondary">
        {t('createBusiness')}
      </button>
    </motion.div>
  );
}
