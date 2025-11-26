'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseQRData } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  onProductScanned: (product: Product) => void;
}

export function ScannerModal({
  isOpen,
  onClose,
  itemCount,
  onProductScanned,
}: ScannerModalProps) {
  const t = useTranslations('pos');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleScan = useCallback(
    async (decodedText: string) => {
      // Prevent processing if already handling a scan
      if (isProcessingRef.current) return;

      let productId = parseQRData(decodedText);
      if (!productId) productId = decodedText;

      // Prevent rapid re-scanning of the same code
      if (lastScannedRef.current === productId) return;

      isProcessingRef.current = true;
      lastScannedRef.current = productId;

      try {
        const response = await fetch(
          `/api/products/by-qr/${encodeURIComponent(productId)}`
        );
        if (response.ok) {
          const data = await response.json();
          onProductScanned(data.product);

          // Pause scanner for visual feedback and to prevent duplicate scans
          if (scannerRef.current) {
            try {
              await scannerRef.current.pause(true);
              setTimeout(async () => {
                // Reset last scanned so the same item can be scanned again
                lastScannedRef.current = null;
                isProcessingRef.current = false;
                if (scannerRef.current) {
                  try {
                    await scannerRef.current.resume();
                  } catch {
                    // Ignore
                  }
                }
              }, 1000);
            } catch {
              isProcessingRef.current = false;
            }
          } else {
            isProcessingRef.current = false;
          }
        } else {
          isProcessingRef.current = false;
        }
      } catch {
        isProcessingRef.current = false;
      }
    },
    [onProductScanned]
  );

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('pos-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
    }
  }, [handleScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
    // Reset scan state
    isProcessingRef.current = false;
    lastScannedRef.current = null;
  }, []);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">
                {itemCount} {t('items') || 'items'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white p-2 bg-white/10 rounded-lg hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div
              id="pos-scanner"
              className="w-full max-w-md aspect-square rounded-xl overflow-hidden"
            />
          </div>
          <div className="p-4 text-center text-white/70 text-sm">
            {t('scanProducts') || 'Scan products to add to cart'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
