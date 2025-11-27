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
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    }

    fetchSession();
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
