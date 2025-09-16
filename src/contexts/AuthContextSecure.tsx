import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper para log de eventos de segurança
  const logSecurityEvent = async (
    eventType: string, 
    success: boolean, 
    details?: any
  ) => {
    try {
      await supabase.rpc('log_security_event', {
        _user_id: user?.id || null,
        _event_type: eventType,
        _ip_address: null, // Em produção, seria obtido do servidor
        _user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        _success: success,
        _details: details || null
      });
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log de eventos de autenticação
        if (event === 'SIGNED_IN') {
          await logSecurityEvent('login_attempt', true, { method: 'password' });
        } else if (event === 'SIGNED_OUT') {
          await logSecurityEvent('logout', true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Log da tentativa de login
    await logSecurityEvent('login_attempt', !error, { 
      email, 
      error: error?.message 
    });

    if (error) {
      // Verificar se há atividade suspeita
      try {
        const { data: isSuspicious } = await supabase.rpc('detect_suspicious_activity', {
          _ip_address: '127.0.0.1' // Em produção, seria o IP real
        });

        if (isSuspicious) {
          await logSecurityEvent('suspicious_activity', false, {
            reason: 'Multiple failed login attempts',
            email
          });
          
          toast({
            title: "Atividade Suspeita",
            description: "Múltiplas tentativas de login falharam. Aguarde antes de tentar novamente.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
        }
      } catch (detectionError) {
        console.error('Erro na detecção de atividade suspeita:', detectionError);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        });
      }
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    // Log da tentativa de registro
    await logSecurityEvent('signup_attempt', !error, { email });

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await logSecurityEvent('logout', true);
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso"
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
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