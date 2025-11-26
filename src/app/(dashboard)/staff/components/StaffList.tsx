'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Users, Crown, Shield, User, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

interface StaffMember {
  id: string;
  memberId?: string;
  name: string;
  username?: string;
  photoUrl?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewReports: boolean;
    canManageStaff: boolean;
  };
}

interface StaffListProps {
  staff: StaffMember[];
  isOwner: boolean;
  onEdit: (member: StaffMember) => void;
  onRemove: (memberId: string) => void;
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'OWNER':
      return Crown;
    case 'MANAGER':
      return Shield;
    default:
      return User;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'OWNER':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'MANAGER':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  }
}

export function StaffList({ staff, isOwner, onEdit, onRemove }: StaffListProps) {
  const t = useTranslations('staff');

  if (staff.length === 0) {
    return <EmptyState icon={Users} title={t('noStaff')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {staff.map((member) => {
        const RoleIcon = getRoleIcon(member.role);
        const roleColor = getRoleColor(member.role);

        return (
          <div key={member.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {member.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {t(member.role.toLowerCase() === 'staff' ? 'staffRole' : member.role.toLowerCase())}
                  </span>
                </div>
              </div>
              {isOwner && member.role !== 'OWNER' && member.memberId && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(member)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onRemove(member.memberId!)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
