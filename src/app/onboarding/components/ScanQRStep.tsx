'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScanQRStepProps {
  onBack: () => void;
  onScan: (code: string) => void;
  error: string | null;
}

export function ScanQRStep({ onBack, onScan, error }: ScanQRStepProps) {
  const t = useTranslations('onboarding');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          let code = decodedText;
          if (decodedText.startsWith('MINIPOS_INVITE:')) {
            code = decodedText.substring(15);
          }
          onScan(code);
        },
        () => {}
      );
    } catch {
      // Ignore
    }
  }, [onScan]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('scanQR')}
      </button>

      <div className="space-y-4">
        <div
          id="qr-scanner"
          ref={scannerContainerRef}
          className="w-full aspect-square rounded-xl overflow-hidden bg-black"
        />

        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Camera className="w-4 h-4 animate-pulse" />
          <span>{t('scanQRDesc')}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
