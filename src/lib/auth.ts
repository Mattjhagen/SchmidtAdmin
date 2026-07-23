// Authentication Service (Supabase Auth + Demo Mock Session)
// Location: src/lib/auth.ts

import { isSupabaseConfigured } from './db';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL as supabaseUrl, SUPABASE_ANON_KEY as supabaseAnonKey } from './supabaseEnv';

const supabase = isSupabaseConfigured ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;


export const ADMIN_EMAILS = [
  'matty@purepulse.one',
  'admin@schmidt-construction.com',
  'mike@walls2.com',
  'mikiel@schmidt-construction.com'
];

export function isAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export interface SessionUser {
  email: string;
  role: 'estimator' | 'admin';
  name: string;
  forcePasswordChange?: boolean;
}

function setAuthCookie(user?: SessionUser) {
  if (typeof document === 'undefined') return;
  document.cookie = 'schmidt_admin=1; path=/; max-age=86400; SameSite=Lax';
  if (user) {
    document.cookie = `schmidt_admin_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'schmidt_admin=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'schmidt_admin_session=; path=/; max-age=0; SameSite=Lax';
}

export const auth = {
  // Check if user is currently logged in
  getSessionUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;

    if (isSupabaseConfigured && supabase) {
      // In production mode, we check active Supabase Auth token
      // For this Next.js app, we check if there is an active session
      // In server components/middleware we check cookies, locally we check supabase client
      // A simple fallback to cookie check works:
      const sessionJson = localStorage.getItem('schmidt_auth_session');
      return sessionJson ? JSON.parse(sessionJson) : null;
    } else {
      // Demo Mode: LocalStorage check
      const sessionJson = localStorage.getItem('schmidt_auth_session');
      return sessionJson ? JSON.parse(sessionJson) : null;
    }
  },

  // Perform mock/Supabase login
  async login(email: string, password?: string): Promise<SessionUser> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      if (!password) throw new Error('Password is required in Supabase mode');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      const user: SessionUser = {
        email: data.user.email || email,
        role: isAdmin(data.user.email || email) ? 'admin' : 'estimator',
        name: data.user.user_metadata?.name || 'Estimator',
        forcePasswordChange: !!data.user.user_metadata?.force_password_change
      };

      localStorage.setItem('schmidt_auth_session', JSON.stringify(user));
      setAuthCookie(user);
      return user;
    } else {
      // Demo Mode Login
      // Accept any credentials, default values if blank
      const finalEmail = email || 'estimator@schmidt.com';
      const user: SessionUser = {
        email: finalEmail,
        role: isAdmin(finalEmail) ? 'admin' : 'estimator',
        name: finalEmail.split('@')[0].toUpperCase(),
        forcePasswordChange: false
      };

      localStorage.setItem('schmidt_auth_session', JSON.stringify(user));
      setAuthCookie(user);
      return user;
    }
  },

  // Logout
  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('schmidt_auth_session');
    clearAuthCookie();
  }
};
