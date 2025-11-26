'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { UserPlus, Check, Copy, QrCode, Send } from 'lucide-react';

interface InviteCardProps {
  inviteCode: string;
  businessName: string;
  onShowQR: () => void;
}

export function InviteCard({ inviteCode, businessName, onShowQR }: InviteCardProps) {
  const t = useTranslations('staff');
  const [copied, setCopied] = useState(false);

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaTelegram() {
    const message = encodeURIComponent(
      `${t('telegramInviteMessage', { businessName })}\n\n${t('inviteCode')}: ${inviteCode}`
    );
    const url = `https://t.me/share/url?url=&text=${message}`;
    window.open(url, '_blank');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('inviteStaff')}
        </h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {t('inviteCodeDesc')}
      </p>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-center text-sm">
          {inviteCode}
        </div>
        <button
          onClick={copyInviteCode}
          className="btn btn-secondary"
          title={t('copyCode')}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={onShowQR}
          className="btn btn-secondary"
          title={t('showQR')}
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={shareViaTelegram}
        className="w-full btn btn-primary flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {t('shareViaTelegram')}
      </button>
    </motion.div>
  );
}
