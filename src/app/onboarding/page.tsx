'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  QrCode,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { fetchApi } from '@/lib/api';

type OnboardingStep = 'choice' | 'create' | 'join-code' | 'scan-qr' | 'pending';

const CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'KES', name: 'Kenyan Shilling' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tCurrencies = useTranslations('currencies');

  const [step, setStep] = useState<OnboardingStep>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBusiness, setPendingBusiness] = useState<string | null>(null);

  // Create business form
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('ETB');

  // Join business form
  const [inviteCode, setInviteCode] = useState('');

  // QR Scanner
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Check for pending request on mount
  useEffect(() => {
    checkPendingRequest();
  }, []);

  async function checkPendingRequest() {
    try {
      const data = await fetchApi<{ pendingRequest: { businessName: string } | null }>('/api/business/pending-request');
      if (data.pendingRequest) {
        setPendingBusiness(data.pendingRequest.businessName);
        setStep('pending');
      }
    } catch {
      // Ignore errors
    }
  }

  async function handleCreateBusiness() {
    if (!businessName.trim()) {
      setError(t('businessName') + ' is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetchApi('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          currency,
        }),
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinWithCode() {
    if (!inviteCode.trim()) {
      setError(t('inviteCode') + ' is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<{ status: string; businessName: string }>('/api/business/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      if (data.status === 'pending') {
        setPendingBusiness(data.businessName);
        setStep('pending');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join business');
    } finally {
      setLoading(false);
    }
  }

  const handleJoinWithQR = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<{ status: string; businessName: string }>('/api/business/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      if (data.status === 'pending') {
        setPendingBusiness(data.businessName);
        setStep('pending');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join business');
      setStep('choice');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    setScanning(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);

          // Parse QR code - expect format: MINIPOS_INVITE:CODE
          let code = decodedText;
          if (decodedText.startsWith('MINIPOS_INVITE:')) {
            code = decodedText.substring(15);
          }

          setInviteCode(code);
          handleJoinWithQR(code);
        },
        () => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      setScanning(false);
      setError('Failed to start camera');
    }
  }, [handleJoinWithQR]);

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



  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    // Start scanner when step changes to scan-qr
    if (step === 'scan-qr') {
      startScanner();
    } else {
      stopScanner();
    }
  }, [step, startScanner, stopScanner]);

  const renderChoice = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      <button
        onClick={() => setStep('create')}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('createBusiness')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('createBusinessDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => setStep('join-code')}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('enterCode')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('enterCodeDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => setStep('scan-qr')}
        className="w-full card card-hover p-4 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <QrCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('scanQR')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('scanQRDesc')}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </button>
    </motion.div>
  );

  const renderCreate = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button
        onClick={() => setStep('choice')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('createBusiness')}
      </button>

      <div className="space-y-4">
        <div>
          <label className="label">{t('businessName')}</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={t('businessNamePlaceholder')}
            className="input"
            autoFocus
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

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleCreateBusiness}
          disabled={loading || !businessName.trim()}
          className="w-full btn btn-primary py-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('creating')}
            </>
          ) : (
            t('createButton')
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderJoinCode = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button
        onClick={() => setStep('choice')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('enterCode')}
      </button>

      <div className="space-y-4">
        <div>
          <label className="label">{t('inviteCode')}</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t('inviteCodePlaceholder')}
            className="input font-mono text-center text-lg tracking-wider"
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleJoinWithCode}
          disabled={loading || !inviteCode.trim()}
          className="w-full btn btn-primary py-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('requesting')}
            </>
          ) : (
            t('requestToJoin')
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderScanQR = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button
        onClick={() => setStep('choice')}
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

        {scanning && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Camera className="w-4 h-4 animate-pulse" />
            <span>{t('scanQRDesc')}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPending = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
        <Users className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('pendingRequest')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {t('pendingRequestDesc', { businessName: pendingBusiness || '' })}
        </p>
      </div>

      <button
        onClick={() => {
          setStep('choice');
          setPendingBusiness(null);
        }}
        className="btn btn-secondary"
      >
        {t('createBusiness')}
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'choice' && <div key="choice">{renderChoice()}</div>}
          {step === 'create' && <div key="create">{renderCreate()}</div>}
          {step === 'join-code' && <div key="join-code">{renderJoinCode()}</div>}
          {step === 'scan-qr' && <div key="scan-qr">{renderScanQR()}</div>}
          {step === 'pending' && <div key="pending">{renderPending()}</div>}
        </AnimatePresence>
      </div>
    </div>
  );
}
