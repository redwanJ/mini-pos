'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Shield,
  User,
  Check,
  X,
  Copy,
  QrCode,
  Loader2,
  UserPlus,
  Trash2,
  Send,
  Edit2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/PageHeader';

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
  const tCommon = useTranslations('common');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

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
        setInviteCode(data.inviteCode || '');
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

    // Get current user role from session (simplified)
    const session = document.cookie
      .split('; ')
      .find((row) => row.startsWith('session='));
    if (session) {
      try {
        const { role } = JSON.parse(decodeURIComponent(session.split('=')[1]));
        setCurrentUserRole(role || '');
      } catch {
        // Ignore
      }
    }
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

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaTelegram() {
    const message = encodeURIComponent(
      `${t('telegramInviteMessage', { businessName })}\n\n${t('inviteCode')}: ${inviteCode}`
    );
    const url = `https://t.me/share/url?url=&text=${message}`;
    window.open(url, '_blank');
  }

  async function handleUpdateRole(memberId: string, newRole: 'MANAGER' | 'STAFF') {
    if (!editingMember) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/staff/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          permissions: newRole === 'MANAGER'
            ? { canAddProducts: true, canEditProducts: true, canDeleteProducts: false, canViewReports: true, canManageStaff: false }
            : { canAddProducts: true, canEditProducts: false, canDeleteProducts: false, canViewReports: false, canManageStaff: false },
        }),
      });

      if (response.ok) {
        setEditingMember(null);
        fetchStaff();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setSaving(false);
    }
  }

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'MANAGER':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const isOwner = currentUserRole === 'OWNER';

  return (
    <div>
      <PageHeader title={t('title')} />

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Invite Card (Owner only) */}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('inviteStaff')}
                  </h3>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t('inviteCodeDesc')}
                </p>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-center text-sm">
                    {inviteCode}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="btn btn-secondary"
                    title={t('copyCode')}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    className="btn btn-secondary"
                    title={t('showQR')}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={shareViaTelegram}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t('shareViaTelegram')}
                </button>
              </motion.div>
            )}

            {/* Pending Requests (Owner only) */}
            {isOwner && pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {t('pendingRequests')} ({pendingRequests.length})
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.name}
                        </p>
                        {request.username && (
                          <p className="text-sm text-gray-500">@{request.username}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Staff List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {staff.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('noStaff')}</p>
                </div>
              ) : (
                staff.map((member) => {
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
                              onClick={() => setEditingMember(member)}
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemove(member.memberId!)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('inviteCode')}
              </h3>
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG
                  value={`MINIPOS_INVITE:${inviteCode}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 font-mono">{inviteCode}</p>
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 btn btn-secondary"
              >
                {tCommon('cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setEditingMember(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('editStaff')}
                </h2>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  {editingMember.name}
                </p>
                {editingMember.username && (
                  <p className="text-sm text-gray-500">@{editingMember.username}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="label">{t('role')}</label>
                <button
                  onClick={() => handleUpdateRole(editingMember.memberId!, 'MANAGER')}
                  disabled={saving}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    editingMember.role === 'MANAGER'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">{t('manager')}</p>
                    <p className="text-xs text-gray-500">{t('managerDesc')}</p>
                  </div>
                  {editingMember.role === 'MANAGER' && (
                    <Check className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </button>
                <button
                  onClick={() => handleUpdateRole(editingMember.memberId!, 'STAFF')}
                  disabled={saving}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    editingMember.role === 'STAFF'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium">{t('staffRole')}</p>
                    <p className="text-xs text-gray-500">{t('staffDesc')}</p>
                  </div>
                  {editingMember.role === 'STAFF' && (
                    <Check className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </button>
              </div>

              {saving && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
