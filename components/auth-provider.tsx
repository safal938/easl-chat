// drqna/components/auth-provider.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  isGuestMode: boolean;
  enableGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuestMode: false,
  enableGuestMode: () => {},
});

const GUEST_MODE_KEY = 'easl_guest_mode_enabled';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check if guest mode is enabled on mount, default to true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guestModeEnabled = localStorage.getItem(GUEST_MODE_KEY);
      // Default to guest mode if not explicitly set
      if (guestModeEnabled === null) {
        localStorage.setItem(GUEST_MODE_KEY, 'true');
        setIsGuestMode(true);
      } else {
        setIsGuestMode(guestModeEnabled === 'true');
      }
    }
  }, []);

  // Redirect to login only if not in guest mode and not authenticated
  useEffect(() => {
    if (!loading && !user && !isGuestMode && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, isGuestMode, router, pathname]);

  const enableGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
      setIsGuestMode(true);
      // Redirect to home if on login page
      if (pathname === '/login') {
        router.push('/');
      }
    }
  };

  if (loading && !isGuestMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isGuestMode, enableGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);