'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client'; // Use alias if possible, else relative path
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export default function AuthProvider({ children }) {
  const { setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Fetch role
        const role = await authService.getUserRole(user.uid);
        setUser(user);
        setRole(role);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setRole, setLoading]);

  return <>{children}</>;
}

//Firebase SDK automatically saves the user's 
// session token in the browser's internal storage (IndexedDB )
// async (user ) fetches IndexDB for check user state , or any changes in user state (login logout)
