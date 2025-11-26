'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { fetchApi } from '@/lib/api';
import {
  ChoiceStep,
  CreateBusinessStep,
  JoinCodeStep,
  ScanQRStep,
  PendingStep,
} from './components';

type OnboardingStep = 'choice' | 'create' | 'join-code' | 'scan-qr' | 'pending';

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>('choice');
  const [pendingBusiness, setPendingBusiness] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    checkPendingRequest();
  }, []);

  async function checkPendingRequest() {
    try {
      const data = await fetchApi<{ pendingRequest: { businessName: string } | null }>(
        '/api/business/pending-request'
      );
      if (data.pendingRequest) {
        setPendingBusiness(data.pendingRequest.businessName);
        setStep('pending');
      }
    } catch {
      // Ignore errors
    }
  }

  async function handleCreateBusiness(name: string, currency: string) {
    await fetchApi('/api/business/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency }),
    });
    router.push('/dashboard');
  }

  async function handleJoinWithCode(code: string) {
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
  }

  async function handleQRScan(code: string) {
    setScanError(null);
    try {
      await handleJoinWithCode(code);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to join business');
      setStep('choice');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'choice' && (
            <div key="choice">
              <ChoiceStep
                onSelectCreate={() => setStep('create')}
                onSelectJoinCode={() => setStep('join-code')}
                onSelectScanQR={() => setStep('scan-qr')}
              />
            </div>
          )}
          {step === 'create' && (
            <div key="create">
              <CreateBusinessStep
                onBack={() => setStep('choice')}
                onSubmit={handleCreateBusiness}
              />
            </div>
          )}
          {step === 'join-code' && (
            <div key="join-code">
              <JoinCodeStep
                onBack={() => setStep('choice')}
                onSubmit={handleJoinWithCode}
              />
            </div>
          )}
          {step === 'scan-qr' && (
            <div key="scan-qr">
              <ScanQRStep
                onBack={() => setStep('choice')}
                onScan={handleQRScan}
                error={scanError}
              />
            </div>
          )}
          {step === 'pending' && (
            <div key="pending">
              <PendingStep
                businessName={pendingBusiness || ''}
                onCreateNew={() => {
                  setStep('choice');
                  setPendingBusiness(null);
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
