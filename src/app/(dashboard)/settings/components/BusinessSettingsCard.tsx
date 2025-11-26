'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Loader2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AlertMessage } from '@/components/ui/AlertMessage';
import { CURRENCIES } from '@/lib/constants';

interface BusinessSettingsCardProps {
  initialData: {
    name: string;
    currency: string;
    taxRate: string;
    receiptMessage: string;
  };
}

export function BusinessSettingsCard({ initialData }: BusinessSettingsCardProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tCurrencies = useTranslations('currencies');

  const [businessName, setBusinessName] = useState(initialData.name);
  const [currency, setCurrency] = useState(initialData.currency);
  const [taxRate, setTaxRate] = useState(initialData.taxRate);
  const [receiptMessage, setReceiptMessage] = useState(initialData.receiptMessage);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          currency,
          taxRate: parseFloat(taxRate),
          receiptMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader icon={Building2} iconColor="text-blue-600" title={t('business')} />

      <div className="space-y-4">
        <div>
          <label className="label">{t('businessName')}</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input"
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

        <div>
          <label className="label">{t('taxRate')} (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="input"
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        <div>
          <label className="label">{t('receiptMessage')}</label>
          <input
            type="text"
            value={receiptMessage}
            onChange={(e) => setReceiptMessage(e.target.value)}
            placeholder={t('receiptMessagePlaceholder')}
            className="input"
          />
        </div>

        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={tCommon('success')} />}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            tCommon('save')
          )}
        </button>
      </div>
    </Card>
  );
}
