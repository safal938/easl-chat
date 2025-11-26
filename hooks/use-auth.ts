import { useState, useEffect } from 'react';
import { useAuthState, useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { Auth, User, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthHookReturn {
  user: User | null | undefined;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
}

const GUEST_MODE_KEY = 'easl_guest_mode_enabled';

export function useAuth(): AuthHookReturn {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [user, loading, authError] = useAuthState(auth);
  const [signInWithEmailAndPassword, , signInLoading, signInError] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword, , signUpLoading, signUpError] = useCreateUserWithEmailAndPassword(auth);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check guest mode on mount, default to true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guestModeEnabled = localStorage.getItem(GUEST_MODE_KEY);
      // Default to guest mode if not explicitly set
      if (guestModeEnabled === null) {
        setIsGuestMode(true);
      } else {
        setIsGuestMode(guestModeEnabled === 'true');
      }
    }
  }, []);

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const res = await createUserWithEmailAndPassword(email, password);
      if (res) {
        router.push('/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  };

  const logIn = async (email: string, password: string): Promise<void> => {
    try {
      const res = await signInWithEmailAndPassword(email, password);
      if (res) {
        router.push('/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  };

  // If in guest mode, don't wait for Firebase auth
  const effectiveLoading = isGuestMode ? false : (loading || signInLoading || signUpLoading);

  return {
    user,
    loading: effectiveLoading,
    error: error ?? signInError?.message ?? signUpError?.message ?? authError?.message ?? null,
    signUp,
    logIn,
  };
}