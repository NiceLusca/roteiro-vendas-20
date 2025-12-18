import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session cache key
const SESSION_CACHE_KEY = 'supabase_session_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedSession {
  session: Session;
  timestamp: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper para log de eventos de segurança (ASSÍNCRONO)
  const logSecurityEventAsync = (
    eventType: string, 
    userId: string | null,
    success: boolean, 
    details?: any
  ) => {
    // Use setTimeout to defer RPC calls and prevent deadlock
    setTimeout(async () => {
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: userId,
          p_event_type: eventType,
          p_ip_address: null,
          p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
          p_success: success,
          p_details: details || null,
          p_severity: 'info'
        });
      } catch (error) {
        logger.error('Erro ao registrar evento de segurança', error as Error, { feature: 'auth', metadata: { eventType, userId } });
      }
    }, 0);
  };

  // Load cached session
  const loadCachedSession = (): Session | null => {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      if (!cached) return null;

      const { session, timestamp }: CachedSession = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_DURATION) {
        return session;
      }
      
      // Cache expired, remove it
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  };

  // Save session to cache
  const cacheSession = (session: Session | null) => {
    try {
      if (session) {
        const cached: CachedSession = {
          session,
          timestamp: Date.now()
        };
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached));
      } else {
        localStorage.removeItem(SESSION_CACHE_KEY);
      }
    } catch (error) {
      logger.error('Error caching session', error as Error, { feature: 'auth' });
    }
  };

  useEffect(() => {
    // Try to load from cache first for instant initialization
    const cachedSession = loadCachedSession();
    if (cachedSession) {
      setSession(cachedSession);
      setUser(cachedSession.user);
      setLoading(false);
    }

    // Set up auth state listener (SYNCHRONOUS only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // CRITICAL: Only synchronous operations here to prevent deadlock
        setSession(session);
        // Only update user if ID actually changed to preserve reference
        const newUser = session?.user ?? null;
        setUser(prev => {
          if (prev?.id === newUser?.id) return prev;
          return newUser;
        });
        setLoading(false);
        
        // Cache the session
        cacheSession(session);

        // Defer RPC calls with setTimeout to prevent deadlock
        if (event === 'SIGNED_IN') {
          logSecurityEventAsync('login_attempt', session?.user?.id || null, true, { method: 'password' });
        } else if (event === 'SIGNED_OUT') {
          logSecurityEventAsync('logout', null, true);
        }
      }
    );

    // THEN check for existing session (this validates the cache)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Only update user if ID actually changed to preserve reference
      const newUser = session?.user ?? null;
      setUser(prev => {
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });
      setLoading(false);
      cacheSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Log async (non-blocking)
      logSecurityEventAsync('login_attempt', null, false, { 
        email, 
        error: error.message 
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    });

    // Log async (non-blocking)
    logSecurityEventAsync('signup_attempt', null, !error, { email });

    return { error };
  };

  const signOut = async () => {
    const userId = user?.id;
    await supabase.auth.signOut();
    
    // Clear cache
    cacheSession(null);
    
    // Log async (non-blocking)
    logSecurityEventAsync('logout', userId || null, true);
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    // Log async (non-blocking)
    logSecurityEventAsync('password_reset_request', null, !error, { email });

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}