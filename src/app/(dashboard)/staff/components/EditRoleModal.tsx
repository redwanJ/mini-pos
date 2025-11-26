'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, User, Check, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface StaffMember {
  id: string;
  memberId?: string;
  name: string;
  username?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: StaffMember | null;
  onUpdateRole: (memberId: string, newRole: 'MANAGER' | 'STAFF') => Promise<void>;
}

export function EditRoleModal({ isOpen, onClose, member, onUpdateRole }: EditRoleModalProps) {
  const t = useTranslations('staff');
  const [saving, setSaving] = useState(false);

  async function handleRoleChange(newRole: 'MANAGER' | 'STAFF') {
    if (!member?.memberId) return;
    setSaving(true);
    try {
      await onUpdateRole(member.memberId, newRole);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('editStaff')}>
      <div className="mb-4">
        <p className="font-medium text-gray-900 dark:text-white mb-1">{member.name}</p>
        {member.username && (
          <p className="text-sm text-gray-500">@{member.username}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="label">{t('role')}</label>
        <button
          onClick={() => handleRoleChange('MANAGER')}
          disabled={saving}
          className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
            member.role === 'MANAGER'
              ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <Shield className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <p className="font-medium">{t('manager')}</p>
            <p className="text-xs text-gray-500">{t('managerDesc')}</p>
          </div>
          {member.role === 'MANAGER' && (
            <Check className="w-5 h-5 text-blue-600 ml-auto" />
          )}
        </button>
        <button
          onClick={() => handleRoleChange('STAFF')}
          disabled={saving}
          className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
            member.role === 'STAFF'
              ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <User className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <p className="font-medium">{t('staffRole')}</p>
            <p className="text-xs text-gray-500">{t('staffDesc')}</p>
          </div>
          {member.role === 'STAFF' && (
            <Check className="w-5 h-5 text-blue-600 ml-auto" />
          )}
        </button>
      </div>

      {saving && (
        <div className="flex justify-center mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
    </Modal>
  );
}
