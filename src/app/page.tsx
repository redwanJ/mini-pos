'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, LogIn } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import '@/types'; // Import Telegram type declarations

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const [status, setStatus] = useState<'loading' | 'logged_out' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const authAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple authentication attempts
    if (authAttempted.current) return;
    authAttempted.current = true;

    async function authenticate() {
      try {
        // Check for error from redirect
        const errorParam = searchParams.get('error');
        if (errorParam === 'session_verification_failed') {
          setError(t('sessionExpired') || 'Session verification failed');
          setStatus('error');
          return;
        }

        // Check if user explicitly logged out
        const isLoggedOut = localStorage.getItem('logged_out') === 'true';
        if (isLoggedOut) {
          setStatus('logged_out');
          return;
        }

        // Wait for Telegram WebApp to be ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || '';
        const platform = tg?.platform || 'unknown';

        // In development, allow mock data
        if (!initData && process.env.NODE_ENV === 'development') {
          // Create mock init data for development
          const mockUser = {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
          };

          const data = await fetchApi<{ needsOnboarding: boolean }>('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              initData: '',
              mockUser: mockUser
            }),
          });

          if (data.needsOnboarding) {
            router.replace('/onboarding');
          } else {
            router.replace('/dashboard');
          }
          return;
        }

        // Check if running in Telegram Web (browser) vs native app
        const isTelegramWeb = platform === 'web' || platform === 'weba';

        if (!initData) {
          // If no init data and not in development, show error
          // But for Telegram Web, we might need to handle differently
          if (isTelegramWeb) {
            setError(t('telegramWebNotSupported') || t('loginFailed'));
          } else {
            setError(t('loginFailed'));
          }
          setStatus('error');
          return;
        }

        // Authenticate with the server
        const data = await fetchApi<{ needsOnboarding: boolean }>('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        if (data.needsOnboarding) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : t('loginFailed'));
        setStatus('error');
      }
    }

    authenticate();
  }, [router, t]);

  const handleLogin = () => {
    localStorage.removeItem('logged_out');
    authAttempted.current = false;
    setStatus('loading');
    setError(null);
    window.location.reload();
  };

  if (status === 'logged_out') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('welcome')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('loggedOut')}</p>
          <button
            onClick={handleLogin}
            className="btn btn-primary"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {t('loginWithTelegram')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('welcome')}
          </h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            {t('loginWithTelegram')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('welcome')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t('loggingIn')}</p>
      </div>
    </div>
  );
}
