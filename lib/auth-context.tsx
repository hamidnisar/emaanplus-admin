'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Role = 'super_admin' | 'admin' | 'editor';

interface AdminUser {
  uid: string;
  email: string;
  role: Role;
  displayName: string;
}

const AuthContext = createContext<{ user: AdminUser | null; loading: boolean }>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // fetch role from Firestore admins collection
        const snap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (snap.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            role: snap.data().role as Role,
            displayName: snap.data().displayName || firebaseUser.email!,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);