'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Package,
  Minus,
  Plus,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader } from '@/components/PageHeader';
import { parseQRData, formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
}

export default function ScannerPage() {
  const t = useTranslations('scanner');
  const tCommon = useTranslations('common');

  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currency, setCurrency] = useState('ETB');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Fetch business currency
    async function fetchBusiness() {
      try {
        const response = await fetch('/api/business');
        if (response.ok) {
          const data = await response.json();
          setCurrency(data.business?.currency || 'ETB');
        }
      } catch {
        // Ignore
      }
    }
    fetchBusiness();
  }, []);

  // Ref to break circular dependency
  const startScannerRef = useRef<() => Promise<void>>(async () => { });

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const resumeScanner = useCallback(() => {
    setProduct(null);
    setQuantity(1);
    setError(null);
    setSuccess(false);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch {
        // Restart if resume fails
        stopScanner().then(() => startScannerRef.current());
      }
    }
  }, [stopScanner]);

  const handleScan = useCallback(async (decodedText: string) => {
    // Parse QR code
    let productId = parseQRData(decodedText);
    if (!productId) {
      productId = decodedText; // Try raw value
    }

    // Pause scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
      } catch {
        // Ignore
      }
    }

    // Fetch product
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/products/by-qr/${encodeURIComponent(productId)}`);
      if (!response.ok) {
        throw new Error(t('productNotFound'));
      }

      const data = await response.json();
      setProduct(data.product);
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('productNotFound'));
      resumeScanner();
    } finally {
      setLoading(false);
    }
  }, [resumeScanner, t]);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        () => { }
      );
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera');
    }
  }, [handleScan]);

  // Update ref
  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);



  async function handleDeductStock() {
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products/deduct-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deduct stock');
      }

      const data = await response.json();
      setProduct({ ...product, stock: data.newStock });
      setSuccess(true);

      // Auto-resume after success
      setTimeout(() => {
        resumeScanner();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deduct stock');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('title')} />

      <div className="p-4">
        {/* Scanner Container */}
        <div className="relative mb-4">
          <div
            id="qr-scanner"
            className="w-full aspect-square rounded-xl overflow-hidden bg-black"
          />

          {!scanning && !product && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Camera className="w-12 h-12 mb-2" />
              <p>{t('scanning')}</p>
            </div>
          )}
        </div>

        {/* Scanning Instructions */}
        {scanning && !product && !error && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {t('pointCamera')}
          </p>
        )}

        {/* Loading */}
        {loading && !product && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Found */}
        <AnimatePresence>
          {product && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-4"
            >
              {success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('stockDeducted')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {product.name}: {product.stock} remaining
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(product.salePrice, currency)} • Stock:{' '}
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('quantity')}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(Math.min(product.stock, quantity + 1))
                        }
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={resumeScanner}
                      className="flex-1 btn btn-secondary py-3"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={handleDeductStock}
                      disabled={loading || product.stock < quantity}
                      className="flex-1 btn btn-primary py-3"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t('deductStock')
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
