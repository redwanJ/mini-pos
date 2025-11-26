'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Info,
  LogOut,
  Loader2,
  Check,
  AlertCircle,
  BarChart3,
  Users,
  ChevronRight,
  Repeat,
  Plus,
  Crown,
  Shield,
  User,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

interface UserBusiness {
  id: string;
  name: string;
  role: string;
  isCurrent: boolean;
}

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
  const tOnboarding = useTranslations('onboarding');

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

  // Multiple business support
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessCurrency, setNewBusinessCurrency] = useState('ETB');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Fetch business settings and user's businesses in parallel
        const [businessRes, businessesRes] = await Promise.all([
          fetch('/api/business'),
          fetch('/api/user/businesses'),
        ]);

        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinessName(data.business?.name || '');
          setCurrency(data.business?.currency || 'ETB');
          setTaxRate((data.business?.taxRate || 0).toString());
          setReceiptMessage(data.business?.receiptMessage || '');
        }

        if (businessesRes.ok) {
          const data = await businessesRes.json();
          setBusinesses(data.businesses || []);
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
      // Set logged out flag to prevent auto-login
      localStorage.setItem('logged_out', 'true');
      // Use replace to prevent back button from going to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  async function handleSwitchBusiness(businessId: string) {
    setSwitching(true);
    try {
      const response = await fetch('/api/auth/switch-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      if (response.ok) {
        // Reload the page to apply new business context
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch business:', error);
    } finally {
      setSwitching(false);
    }
  }

  async function handleCreateBusiness() {
    if (!newBusinessName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBusinessName.trim(),
          currency: newBusinessCurrency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Switch to the new business
        await handleSwitchBusiness(data.business.id);
      }
    } catch (error) {
      console.error('Failed to create business:', error);
    } finally {
      setCreating(false);
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return Crown;
      case 'MANAGER':
        return Shield;
      default:
        return User;
    }
  };

  const currentBusiness = businesses.find(b => b.isCurrent);

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

        {/* Switch Business (if multiple businesses) */}
        {businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Repeat className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('switchBusiness')}
              </h3>
            </div>

            {currentBusiness && (
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const RoleIcon = getRoleIcon(currentBusiness.role);
                    return <RoleIcon className="w-4 h-4 text-purple-600" />;
                  })()}
                  <span className="font-medium text-purple-700 dark:text-purple-300">
                    {currentBusiness.name}
                  </span>
                </div>
                <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  {t('current')}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {businesses.length > 1 && (
                <button
                  onClick={() => setShowBusinessModal(true)}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  {t('switchBusiness')}
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 btn btn-secondary text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('createNewBusiness')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Access Links */}
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

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
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
      </div>

      {/* Switch Business Modal */}
      <AnimatePresence>
        {showBusinessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowBusinessModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('switchBusiness')}
                </h2>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
                {businesses.map((business) => {
                  const RoleIcon = getRoleIcon(business.role);
                  return (
                    <button
                      key={business.id}
                      onClick={() => {
                        if (!business.isCurrent) {
                          handleSwitchBusiness(business.id);
                        }
                      }}
                      disabled={switching || business.isCurrent}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        business.isCurrent
                          ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <RoleIcon className={`w-5 h-5 ${
                        business.role === 'OWNER' ? 'text-yellow-600' :
                        business.role === 'MANAGER' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <div className="text-left flex-1">
                        <p className="font-medium">{business.name}</p>
                        <p className="text-xs text-gray-500">{business.role}</p>
                      </div>
                      {business.isCurrent && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </button>
                  );
                })}

                {switching && (
                  <div className="flex justify-center mt-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Business Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('createNewBusiness')}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
                <div>
                  <label className="label">{tOnboarding('businessName')}</label>
                  <input
                    type="text"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    placeholder={tOnboarding('businessNamePlaceholder')}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">{tOnboarding('currency')}</label>
                  <select
                    value={newBusinessCurrency}
                    onChange={(e) => setNewBusinessCurrency(e.target.value)}
                    className="input"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {tCurrencies(c.code)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 safe-bottom">
                <button
                  onClick={handleCreateBusiness}
                  disabled={creating || !newBusinessName.trim()}
                  className="w-full btn btn-primary py-3"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    tOnboarding('createButton')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
