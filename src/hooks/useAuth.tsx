import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 [useAuth] Inicializando autenticação...');
    
    // FIRST get existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ [useAuth] Erro ao buscar sessão:', error);
      }
      console.log('📦 [useAuth] Sessão inicial:', session ? `Usuário: ${session.user.email}` : 'Nenhuma sessão');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 [useAuth] Evento de auth:', event, session ? `Usuário: ${session.user.email}` : 'Sem sessão');
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      console.log('🧹 [useAuth] Limpando subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 SignOut chamado');
    try {
      // Use scope: 'local' to ensure local session is ALWAYS cleared
      // even if the server session is already expired/invalid
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.warn('Logout error (ignoring):', error);
      }
    } catch (error) {
      console.warn('Error during logout process (ignoring):', error);
    } finally {
      // Force clear localStorage as fallback
      try {
        window.localStorage.removeItem('youly-auth-token');
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
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