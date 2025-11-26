'use client';

import { useState, useEffect } from 'react';

interface BusinessData {
  id: string;
  name: string;
  currency: string;
  taxRate: number;
  receiptMessage: string;
}

interface UseBusinessReturn {
  business: BusinessData | null;
  currency: string;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useBusiness(): UseBusinessReturn {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchBusiness() {
    try {
      const response = await fetch('/api/business');
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business || null);
      }
    } catch (error) {
      console.error('Failed to fetch business:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBusiness();
  }, []);

  return {
    business,
    currency: business?.currency || 'ETB',
    loading,
    refetch: fetchBusiness,
  };
}
