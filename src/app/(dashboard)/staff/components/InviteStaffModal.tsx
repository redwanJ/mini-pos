'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { InviteLinkCard } from './InviteLinkCard';

interface InviteStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessName: string;
}

export function InviteStaffModal({
    isOpen,
    onClose,
    businessName,
}: InviteStaffModalProps) {
    const t = useTranslations('staff');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('inviteStaff')}>
            <InviteLinkCard businessName={businessName} className="w-full" />
        </Modal>
    );
}
