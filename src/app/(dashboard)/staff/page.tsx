'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSession } from '@/hooks/useSession';
import {
  InviteLinkCard,
  PendingRequests,
  StaffList,
  EditRoleModal,
} from './components';

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

interface PendingRequest {
  id: string;
  userId: string;
  name: string;
  username?: string;
  createdAt: string;
}

export default function StaffPage() {
  const t = useTranslations('staff');
  const { isOwner } = useSession();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const [staffRes, businessRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/business'),
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff);
        setPendingRequests(data.pendingRequests);
      }

      if (businessRes.ok) {
        const data = await businessRes.json();
        setBusinessName(data.business?.name || 'Mini POS');
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handleApprove(requestId: string) {
    try {
      const response = await fetch(`/api/staff/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  }

  async function handleReject(requestId: string) {
    try {
      const response = await fetch(`/api/staff/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm(t('removeConfirm'))) return;

    try {
      const response = await fetch(`/api/staff/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error('Failed to remove staff:', error);
    }
  }

  async function handleUpdateRole(memberId: string, newRole: 'MANAGER' | 'STAFF') {
    const response = await fetch(`/api/staff/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: newRole,
        permissions:
          newRole === 'MANAGER'
            ? {
                canAddProducts: true,
                canEditProducts: true,
                canDeleteProducts: false,
                canViewReports: true,
                canManageStaff: false,
              }
            : {
                canAddProducts: true,
                canEditProducts: false,
                canDeleteProducts: false,
                canViewReports: false,
                canManageStaff: false,
              },
      }),
    });

    if (response.ok) {
      setEditingMember(null);
      fetchStaff();
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <PageHeader title={t('title')} />

      <div className="p-4 space-y-6">
        {isOwner && (
          <InviteLinkCard businessName={businessName} />
        )}

        {isOwner && (
          <PendingRequests
            requests={pendingRequests}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        <StaffList
          staff={staff}
          isOwner={isOwner}
          onEdit={setEditingMember}
          onRemove={handleRemove}
        />
      </div>

      <EditRoleModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onUpdateRole={handleUpdateRole}
      />
    </div>
  );
}
