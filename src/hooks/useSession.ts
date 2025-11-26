'use client';

import { useState, useEffect } from 'react';

interface SessionData {
  userId: string;
  businessId: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  name: string;
}

interface UseSessionReturn {
  session: SessionData | null;
  isOwner: boolean;
  isManager: boolean;
  canManageStaff: boolean;
  canViewReports: boolean;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('session='));

    if (sessionCookie) {
      try {
        const data = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        setSession(data);
      } catch {
        // Ignore
      }
    }
  }, []);

  const isOwner = session?.role === 'OWNER';
  const isManager = session?.role === 'MANAGER';

  return {
    session,
    isOwner,
    isManager,
    canManageStaff: isOwner,
    canViewReports: isOwner || isManager,
  };
}
