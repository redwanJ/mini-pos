'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function InstallPrompt() {
    const t = useTranslations('common');
    const [showInstall, setShowInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        // Check if running in Telegram
        if (window.Telegram?.WebApp) {
            setIsTelegram(true);
            window.Telegram.WebApp.checkHomeScreenStatus((status) => {
                if (status === 'missed' || status === 'unknown') {
                    setShowInstall(true);
                }
            });
        } else {
            // Browser PWA install prompt
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowInstall(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstall = async () => {
        if (isTelegram) {
            window.Telegram?.WebApp?.addToHomeScreen();
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowInstall(false);
            }
        }
    };

    if (!showInstall) return null;

    return (
        <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
            <Download className="w-4 h-4" />
            <span>{t('installApp')}</span>
        </button>
    );
}
