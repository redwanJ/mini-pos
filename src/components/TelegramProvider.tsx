'use client';

import { useEffect } from 'react';
import '@/types'; // Import Telegram type declarations

interface TelegramProviderProps {
  children: React.ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      // Signal app is ready
      tg.ready();

      // Expand to full screen
      tg.expand();

      // Enable closing confirmation - shows modal when user tries to close
      try {
        tg.enableClosingConfirmation();
      } catch {
        // Some older versions might not support this
      }

      // Set theme colors
      try {
        tg.setHeaderColor('#3b82f6');
        tg.setBackgroundColor('#f9fafb');
      } catch {
        // Some platforms don't support these methods
      }
    }

    // Cleanup: disable closing confirmation when component unmounts
    return () => {
      try {
        window.Telegram?.WebApp?.disableClosingConfirmation();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  return <>{children}</>;
}
