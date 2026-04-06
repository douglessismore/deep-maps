import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthContext, sendMagicLink, signOutUser, getSession } from '../../lib/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    getSession().then((s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string) => {
    return sendMagicLink(email);
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}
