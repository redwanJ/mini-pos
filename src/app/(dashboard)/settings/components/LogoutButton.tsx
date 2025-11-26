'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const t = useTranslations('settings');

  async function handleLogout() {
    if (!confirm(t('logoutConfirm'))) return;

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.setItem('logged_out', 'true');
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <button
        onClick={handleLogout}
        className="w-full btn btn-danger py-3 flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        {t('logout')}
      </button>
    </motion.div>
  );
}
