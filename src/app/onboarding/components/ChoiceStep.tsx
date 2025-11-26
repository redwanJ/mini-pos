'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, KeyRound, QrCode, ArrowRight } from 'lucide-react';

interface ChoiceStepProps {
  onSelectCreate: () => void;
  onSelectJoinCode: () => void;
  onSelectScanQR: () => void;
}

export function ChoiceStep({ onSelectCreate, onSelectJoinCode, onSelectScanQR }: ChoiceStepProps) {
  const t = useTranslations('onboarding');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      <button
        onClick={onSelectCreate}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('createBusiness')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('createBusinessDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={onSelectJoinCode}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('enterCode')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('enterCodeDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={onSelectScanQR}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <QrCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('scanQR')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('scanQRDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>
    </motion.div>
  );
}
