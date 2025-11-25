'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Bell,
  Database,
  Info,
  LogOut,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

const CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'KES', name: 'Kenyan Shilling' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
];

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tCurrencies = useTranslations('currencies');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Business settings
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [taxRate, setTaxRate] = useState('0');
  const [receiptMessage, setReceiptMessage] = useState('');

  // App settings
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Fetch business settings
        const businessRes = await fetch('/api/business');
        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinessName(data.business?.name || '');
          setCurrency(data.business?.currency || 'ETB');
          setTaxRate((data.business?.taxRate || 0).toString());
          setReceiptMessage(data.business?.receiptMessage || '');
        }

        // Get current locale
        const localeCookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith('locale='));
        if (localeCookie) {
          setLanguage(localeCookie.split('=')[1] || 'en');
        }

        // Get user role
        const sessionCookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith('session='));
        if (sessionCookie) {
          try {
            const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
            setIsOwner(session.role === 'OWNER');
          } catch {
            // Ignore
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function handleSaveBusinessSettings() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          currency,
          taxRate: parseFloat(taxRate),
          receiptMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeLanguage(newLanguage: string) {
    setLanguage(newLanguage);

    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLanguage }),
      });

      // Reload to apply new language
      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  async function handleLogout() {
    if (!confirm(t('logoutConfirm'))) return;

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('title')} />

      <div className="p-4 space-y-6">
        {/* Business Settings (Owner only) */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('business')}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">{t('businessName')}</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input"
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

              <div>
                <label className="label">{t('taxRate')} (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="label">{t('receiptMessage')}</label>
                <input
                  type="text"
                  value={receiptMessage}
                  onChange={(e) => setReceiptMessage(e.target.value)}
                  placeholder={t('receiptMessagePlaceholder')}
                  className="input"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Check className="w-4 h-4" />
                  {tCommon('success')}
                </div>
              )}

              <button
                onClick={handleSaveBusinessSettings}
                disabled={saving}
                className="w-full btn btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  tCommon('save')
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('language')}
            </h3>
          </div>

          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChangeLanguage(lang.code)}
                className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                  language === lang.code
                    ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-medium">{lang.nativeName}</span>
                {language === lang.code && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('about')}
            </h3>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">Mini POS - Smart Inventory & QR POS System</p>
            <p>{t('version')}: 2.0.0</p>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleLogout}
            className="w-full btn btn-danger py-3 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
