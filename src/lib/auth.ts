/**
 * Auth layer for community verification.
 * Uses Supabase Auth with magic link (email) flow.
 */
import { createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'AuthProvider not mounted' }),
  signOut: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Send a magic link email. */
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { error: error?.message ?? null };
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}

/** Get the current session (for initial load). */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
