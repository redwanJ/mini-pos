'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Shield, User, Check, Loader2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface UserBusiness {
  id: string;
  name: string;
  role: string;
  isCurrent: boolean;
}

interface SwitchBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: UserBusiness[];
}

export function SwitchBusinessModal({
  isOpen,
  onClose,
  businesses,
}: SwitchBusinessModalProps) {
  const t = useTranslations('settings');
  const [switching, setSwitching] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return Crown;
      case 'MANAGER':
        return Shield;
      default:
        return User;
    }
  };

  async function handleSwitchBusiness(businessId: string) {
    setSwitching(true);
    try {
      const response = await fetch('/api/auth/switch-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch business:', error);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('switchBusiness')}>
      <div className="space-y-2">
        {businesses.map((business) => {
          const RoleIcon = getRoleIcon(business.role);
          return (
            <button
              key={business.id}
              onClick={() => {
                if (!business.isCurrent) {
                  handleSwitchBusiness(business.id);
                }
              }}
              disabled={switching || business.isCurrent}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                business.isCurrent
                  ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <RoleIcon
                className={`w-5 h-5 ${
                  business.role === 'OWNER'
                    ? 'text-yellow-600'
                    : business.role === 'MANAGER'
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              />
              <div className="text-left flex-1">
                <p className="font-medium">{business.name}</p>
                <p className="text-xs text-gray-500">{business.role}</p>
              </div>
              {business.isCurrent && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </button>
          );
        })}

        {switching && (
          <div className="flex justify-center mt-4">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}
      </div>
    </Modal>
  );
}
