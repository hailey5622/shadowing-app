import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { syncLocalActivitiesToSupabase } from '../services/activityService';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SignInGoogleResult {
  url?: string;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  signInWithGoogle: () => Promise<SignInGoogleResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const OAUTH_PENDING_KEY = 'fluent_shadowing_oauth_pending';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);

  const prevUserIdRef = useRef<string | null>(null);

  const syncAndFetchProfile = useCallback(async (authUser: User) => {
    try {
      const supabase = createClient();

      // Try fetching profile created by the database trigger first
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!selectError && existingProfile) {
        setProfile(existingProfile as UserProfile);
        return;
      }

      // Fallback upsert in case the trigger has not yet populated the row
      const meta = authUser.user_metadata || {};
      const appMeta = authUser.app_metadata || {};
      const fallbackRow = {
        id: authUser.id,
        email: authUser.email ?? null,
        full_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
        provider: appMeta.provider || 'google',
        updated_at: new Date().toISOString(),
      };

      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('users')
        .upsert(fallbackRow, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (!upsertError && upsertedProfile) {
        setProfile(upsertedProfile as UserProfile);
      } else {
        setProfile(fallbackRow);
      }
    } catch (err) {
      console.warn('Failed to sync/fetch user profile:', err);
      const meta = authUser.user_metadata || {};
      setProfile({
        id: authUser.id,
        email: authUser.email ?? null,
        full_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
        provider: authUser.app_metadata?.provider || 'google',
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await syncAndFetchProfile(user);
  }, [user, syncAndFetchProfile]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const supabase = createClient();

        // Check for OAuth PKCE code in URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const hasOAuthCallback = Boolean(authCode) || window.location.hash.includes('access_token=');

        if (authCode) {
          try {
            await supabase.auth.exchangeCodeForSession(authCode);
          } catch (exchangeErr) {
            console.warn('Code exchange error (may already be exchanged):', exchangeErr);
          }
          // Clean query string while remaining on the main page
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentSession = sessionData.session ?? null;
        const currentUser = currentSession?.user ?? null;

        setSession(currentSession);
        setUser(currentUser);
        prevUserIdRef.current = currentUser?.id ?? null;

        if (currentUser) {
          await syncAndFetchProfile(currentUser);
          await syncLocalActivitiesToSupabase(currentUser.id);
          const wasOAuthPending = sessionStorage.getItem(OAUTH_PENDING_KEY) === '1';
          if (hasOAuthCallback || wasOAuthPending) {
            sessionStorage.removeItem(OAUTH_PENDING_KEY);
            if (isMounted) setJustLoggedIn(true);
          }
        } else {
          setProfile(null);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
          if (!isMounted) return;

          const nextUser = nextSession?.user ?? null;
          setSession(nextSession);
          setUser(nextUser);

          if (nextUser) {
            await syncAndFetchProfile(nextUser);
            await syncLocalActivitiesToSupabase(nextUser.id);
            const wasNewSignIn =
              event === 'SIGNED_IN' &&
              (prevUserIdRef.current !== nextUser.id ||
                sessionStorage.getItem(OAUTH_PENDING_KEY) === '1');

            if (wasNewSignIn) {
              sessionStorage.removeItem(OAUTH_PENDING_KEY);
              if (isMounted) setJustLoggedIn(true);
            }
            prevUserIdRef.current = nextUser.id;
          } else {
            prevUserIdRef.current = null;
            setProfile(null);
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        console.warn('Supabase Auth initialization skipped or failed:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [syncAndFetchProfile]);

  const clearJustLoggedIn = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<SignInGoogleResult> => {
    try {
      const supabase = createClient();
      sessionStorage.setItem(OAUTH_PENDING_KEY, '1');

      const redirectTo = window.location.origin;
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: isInIframe,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        sessionStorage.removeItem(OAUTH_PENDING_KEY);
        return { error: error.message };
      }

      return { url: data?.url };
    } catch (err: any) {
      sessionStorage.removeItem(OAUTH_PENDING_KEY);
      return { error: err?.message || 'Google 로그인 시작 중 오류가 발생했습니다.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      sessionStorage.removeItem(OAUTH_PENDING_KEY);
      prevUserIdRef.current = null;
      setUser(null);
      setSession(null);
      setProfile(null);
      setJustLoggedIn(false);
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: Boolean(user),
        loading,
        justLoggedIn,
        clearJustLoggedIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
