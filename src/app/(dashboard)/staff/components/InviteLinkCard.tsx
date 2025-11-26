'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link2, Check, Copy, Send, Loader2, Clock, UserPlus } from 'lucide-react';

interface InviteLinkCardProps {
  businessName: string;
  className?: string;
}

interface InviteData {
  token: string;
  role: string;
  expiresAt: string;
  inviteLink: string | null;
  businessName: string;
}

export function InviteLinkCard({ businessName, className }: InviteLinkCardProps) {
  const t = useTranslations('staff');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [selectedRole, setSelectedRole] = useState<'STAFF' | 'MANAGER'>('STAFF');

  async function generateInviteLink() {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, expiresInHours: 24 }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvite(data);
      }
    } catch (error) {
      console.error('Failed to generate invite:', error);
    } finally {
      setLoading(false);
    }
  }

  function copyInviteLink() {
    if (!invite?.inviteLink) return;
    navigator.clipboard.writeText(invite.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaTelegram() {
    if (!invite?.inviteLink) return;
    const message = encodeURIComponent(
      `${t('telegramInviteMessage', { businessName })}\n\n${invite.inviteLink}`
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(invite.inviteLink)}&text=${message}`;
    window.open(url, '_blank');
  }

  function getExpiryText() {
    if (!invite?.expiresAt) return '';
    const expiresAt = new Date(invite.expiresAt);
    const hours = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h` : t('expired');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className || "card p-4"}
    >
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('inviteStaff')}
        </h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('inviteLinkDesc')}
      </p>

      {!invite ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('role')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole('STAFF')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedRole === 'STAFF'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {t('staffRole')}
              </button>
              <button
                onClick={() => setSelectedRole('MANAGER')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedRole === 'MANAGER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {t('manager')}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {selectedRole === 'MANAGER' ? t('managerDesc') : t('staffDesc')}
            </p>
          </div>

          <button
            onClick={generateInviteLink}
            disabled={loading}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            {t('generateInviteLink')}
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('inviteLink')}
              </span>
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <Clock className="w-3 h-3" />
                {getExpiryText()}
              </span>
            </div>
            {invite.inviteLink ? (
              <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {invite.inviteLink}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {t('noBotConfigured')}
              </p>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={copyInviteLink}
              disabled={!invite.inviteLink}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('codeCopied') : t('copyLink')}
            </button>
            <button
              onClick={shareViaTelegram}
              disabled={!invite.inviteLink}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t('shareViaTelegram')}
            </button>
          </div>

          <button
            onClick={() => setInvite(null)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('generateNewLink')}
          </button>
        </>
      )}
    </motion.div>
  );
}
