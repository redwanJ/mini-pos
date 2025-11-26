'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { CURRENCIES } from '@/lib/constants';

interface CreateBusinessStepProps {
  onBack: () => void;
  onSubmit: (name: string, currency: string) => Promise<void>;
}

export function CreateBusinessStep({ onBack, onSubmit }: CreateBusinessStepProps) {
  const t = useTranslations('onboarding');
  const tCurrencies = useTranslations('currencies');

  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!businessName.trim()) {
      setError(t('businessName') + ' is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(businessName.trim(), currency);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card flex flex-col modal-container-lg"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('createBusiness')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-scroll">
        <div>
          <label className="label">{t('businessName')}</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={t('businessNamePlaceholder')}
            className="input"
            autoFocus
          />
        </div>

        <div>
          <label className="label">{t('currency')}</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {tCurrencies(c.code)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="h-4" />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={loading || !businessName.trim()}
          className="w-full btn btn-primary py-3 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('creating')}
            </>
          ) : (
            t('createButton')
          )}
        </button>
      </div>
    </motion.div>
  );
}
