'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { LANGUAGES } from '@/lib/constants';

export function LanguageSettings() {
  const t = useTranslations('settings');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const localeCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='));
    if (localeCookie) {
      setLanguage(localeCookie.split('=')[1] || 'en');
    }
  }, []);

  async function handleChangeLanguage(newLanguage: string) {
    setLanguage(newLanguage);

    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLanguage }),
      });

      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  return (
    <Card delay={0.2}>
      <CardHeader icon={Globe} iconColor="text-green-600" title={t('language')} />

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
    </Card>
  );
}
