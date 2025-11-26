'use client';

import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { CenterModal } from '@/components/ui/Modal';

interface InviteQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
}

export function InviteQRModal({ isOpen, onClose, inviteCode }: InviteQRModalProps) {
  const t = useTranslations('staff');
  const tCommon = useTranslations('common');

  return (
    <CenterModal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          {t('inviteCode')}
        </h3>
        <div className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG value={`MINIPOS_INVITE:${inviteCode}`} size={200} level="H" />
        </div>
        <p className="text-xs text-gray-500 mt-4 font-mono">{inviteCode}</p>
        <button onClick={onClose} className="mt-4 btn btn-secondary">
          {tCommon('cancel')}
        </button>
      </div>
    </CenterModal>
  );
}
