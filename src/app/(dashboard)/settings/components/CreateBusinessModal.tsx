'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CURRENCIES } from '@/lib/constants';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBusinessModal({ isOpen, onClose }: CreateBusinessModalProps) {
  const t = useTranslations('settings');
  const tOnboarding = useTranslations('onboarding');
  const tCurrencies = useTranslations('currencies');

  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessCurrency, setNewBusinessCurrency] = useState('ETB');
  const [creating, setCreating] = useState(false);

  async function handleCreateBusiness() {
    if (!newBusinessName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBusinessName.trim(),
          currency: newBusinessCurrency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Switch to the new business
        const switchResponse = await fetch('/api/auth/switch-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: data.business.id }),
        });

        if (switchResponse.ok) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to create business:', error);
    } finally {
      setCreating(false);
    }
  }

  const footer = (
    <button
      onClick={handleCreateBusiness}
      disabled={creating || !newBusinessName.trim()}
      className="w-full btn btn-primary py-3"
    >
      {creating ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        tOnboarding('createButton')
      )}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createNewBusiness')}
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="label">{tOnboarding('businessName')}</label>
          <input
            type="text"
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            placeholder={tOnboarding('businessNamePlaceholder')}
            className="input"
          />
        </div>

        <div>
          <label className="label">{tOnboarding('currency')}</label>
          <select
            value={newBusinessCurrency}
            onChange={(e) => setNewBusinessCurrency(e.target.value)}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {tCurrencies(c.code)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
