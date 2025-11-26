'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSession } from '@/hooks/useSession';
import {
  BusinessSettingsCard,
  SwitchBusinessCard,
  QuickAccessLinks,
  LanguageSettings,
  AboutSection,
  LogoutButton,
  SwitchBusinessModal,
  CreateBusinessModal,
} from './components';

interface UserBusiness {
  id: string;
  name: string;
  role: string;
  isCurrent: boolean;
}

interface BusinessData {
  name: string;
  currency: string;
  taxRate: number;
  receiptMessage: string;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { isOwner } = useSession();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [businessRes, businessesRes] = await Promise.all([
          fetch('/api/business'),
          fetch('/api/user/businesses'),
        ]);

        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinessData({
            name: data.business?.name || '',
            currency: data.business?.currency || 'ETB',
            taxRate: data.business?.taxRate || 0,
            receiptMessage: data.business?.receiptMessage || '',
          });
        }

        if (businessesRes.ok) {
          const data = await businessesRes.json();
          setBusinesses(data.businesses || []);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const currentBusiness = businesses.find((b) => b.isCurrent);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <PageHeader title={t('title')} />

      <div className="p-4 space-y-6">
        {isOwner && businessData && (
          <BusinessSettingsCard
            initialData={{
              name: businessData.name,
              currency: businessData.currency,
              taxRate: businessData.taxRate.toString(),
              receiptMessage: businessData.receiptMessage,
            }}
          />
        )}

        <SwitchBusinessCard
          businesses={businesses}
          currentBusiness={currentBusiness}
          onSwitchClick={() => setShowBusinessModal(true)}
          onCreateClick={() => setShowCreateModal(true)}
        />

        <QuickAccessLinks />

        <LanguageSettings />

        <AboutSection />

        <LogoutButton />
      </div>

      <SwitchBusinessModal
        isOpen={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        businesses={businesses}
      />

      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
