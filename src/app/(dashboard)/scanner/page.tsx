'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader } from '@/components/PageHeader';
import { AlertBox } from '@/components/ui/AlertMessage';
import { useBusiness } from '@/hooks/useBusiness';
import { parseQRData } from '@/lib/utils';
import { ProductInfoCard, DeductionSuccess } from './components';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
}

export default function ScannerPage() {
  const t = useTranslations('scanner');
  const { currency } = useBusiness();

  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startScannerRef = useRef<() => Promise<void>>(async () => {});

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
        stopScanner().then(() => startScannerRef.current());
      }
    }
  }, [stopScanner]);

  const handleScan = useCallback(
    async (decodedText: string) => {
      let productId = parseQRData(decodedText);
      if (!productId) productId = decodedText;

      if (scannerRef.current) {
        try {
          await scannerRef.current.pause();
        } catch {
          // Ignore
        }
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(
          `/api/products/by-qr/${encodeURIComponent(productId)}`
        );
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
    },
    [resumeScanner, t]
  );

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera');
    }
  }, [handleScan]);

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
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deduct stock');
      }

      const data = await response.json();
      setProduct({ ...product, stock: data.newStock });
      setSuccess(true);

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
        {/* Scanner */}
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

        {/* Instructions */}
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
          {error && <AlertBox type="error" message={error} className="mb-4" />}
        </AnimatePresence>

        {/* Product Found */}
        <AnimatePresence>
          {product &&
            (success ? (
              <div className="card p-4">
                <DeductionSuccess
                  productName={product.name}
                  remainingStock={product.stock}
                />
              </div>
            ) : (
              <ProductInfoCard
                product={product}
                currency={currency}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onCancel={resumeScanner}
                onDeduct={handleDeductStock}
                loading={loading}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
