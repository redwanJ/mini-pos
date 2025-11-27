'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, loading } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/?error=session_verification_failed');
        }
    }, [loading, session, router]);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!session) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
