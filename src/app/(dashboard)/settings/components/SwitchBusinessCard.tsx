'use client';

import { useTranslations } from 'next-intl';
import { Repeat, Plus, Crown, Shield, User } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';

interface UserBusiness {
  id: string;
  name: string;
  role: string;
  isCurrent: boolean;
}

interface SwitchBusinessCardProps {
  businesses: UserBusiness[];
  currentBusiness: UserBusiness | undefined;
  onSwitchClick: () => void;
  onCreateClick: () => void;
}

export function SwitchBusinessCard({
  businesses,
  currentBusiness,
  onSwitchClick,
  onCreateClick,
}: SwitchBusinessCardProps) {
  const t = useTranslations('settings');

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

  if (businesses.length === 0) return null;

  return (
    <Card delay={0.1}>
      <CardHeader icon={Repeat} iconColor="text-purple-600" title={t('switchBusiness')} />

      {currentBusiness && (
        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            {(() => {
              const RoleIcon = getRoleIcon(currentBusiness.role);
              return <RoleIcon className="w-4 h-4 text-purple-600" />;
            })()}
            <span className="font-medium text-purple-700 dark:text-purple-300">
              {currentBusiness.name}
            </span>
          </div>
          <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
            {t('current')}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {businesses.length > 1 && (
          <button
            onClick={onSwitchClick}
            className="flex-1 btn btn-secondary text-sm"
          >
            {t('switchBusiness')}
          </button>
        )}
        <button
          onClick={onCreateClick}
          className="flex-1 btn btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('createNewBusiness')}
        </button>
      </div>
    </Card>
  );
}
