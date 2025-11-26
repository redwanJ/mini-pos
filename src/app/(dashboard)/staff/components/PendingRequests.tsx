'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface PendingRequest {
  id: string;
  userId: string;
  name: string;
  username?: string;
  createdAt: string;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function PendingRequests({ requests, onApprove, onReject }: PendingRequestsProps) {
  const t = useTranslations('staff');

  if (requests.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        {t('pendingRequests')} ({requests.length})
      </h3>
      <div className="space-y-3">
        {requests.map((request) => (
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
                onClick={() => onApprove(request.id)}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
