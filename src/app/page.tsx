'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, LogIn } from 'lucide-react';
import { fetchApi } from '@/lib/api';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [status, setStatus] = useState<'loading' | 'logged_out' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function authenticate() {
      try {
        // Check if user explicitly logged out
        const isLoggedOut = localStorage.getItem('logged_out') === 'true';
        if (isLoggedOut) {
          setStatus('logged_out');
          return;
        }

        // Wait for Telegram WebApp to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        const tg = window.Telegram?.WebApp;

        if (tg) {
          tg.ready();
          tg.expand();
          tg.setHeaderColor('#3b82f6');
          tg.setBackgroundColor('#f9fafb');
        }

        const initData = tg?.initData || '';

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

        if (!initData) {
          setError(t('loginFailed'));
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
        setError(t('loginFailed'));
        setStatus('error');
      }
    }

    authenticate();
  }, [router, t]);

  const handleLogin = () => {
    localStorage.removeItem('logged_out');
    setStatus('loading');
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
