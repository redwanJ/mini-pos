'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface JoinCodeStepProps {
  onBack: () => void;
  onSubmit: (code: string) => Promise<void>;
}

export function JoinCodeStep({ onBack, onSubmit }: JoinCodeStepProps) {
  const t = useTranslations('onboarding');

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!inviteCode.trim()) {
      setError(t('inviteCode') + ' is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(inviteCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join business');
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
          {t('enterCode')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-scroll">
        <div>
          <label className="label">{t('inviteCode')}</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t('inviteCodePlaceholder')}
            className="input font-mono text-center text-lg tracking-wider"
            autoFocus
          />
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
          disabled={loading || !inviteCode.trim()}
          className="w-full btn btn-primary py-3 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('requesting')}
            </>
          ) : (
            t('requestToJoin')
          )}
        </button>
      </div>
    </motion.div>
  );
}
