import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  role: 'client' | 'montador' | 'admin';
  nome: string;
  documento?: string;
  telefone?: string;
  endereco?: any;
}

interface MontadorProfile {
  id: string;
  user_id: string;
  preco_hora?: number;
  especialidades?: string[];
  avaliacao_media?: number;
  projetos_realizados?: number;
  horas_trabalhadas?: number;
  status?: string;
  badges?: string[];
  chave_pix?: string;
  foto_perfil_url?: string;
  total_valor_movimentado?: number;
  total_avaliacoes?: number;
  nivel_gamificacao?: string;
  is_premium?: boolean;
}

interface ClienteProfile {
  id: string;
  user_id: string;
  pedidos_total?: number;
  avaliacao_media?: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [montadorProfile, setMontadorProfile] = useState<MontadorProfile | null>(null);
  const [clienteProfile, setClienteProfile] = useState<ClienteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setMontadorProfile(null);
      setClienteProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Buscar perfil básico
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);

      // Buscar perfil específico baseado no role
      if (profileData.role === 'montador') {
        const { data: montadorData } = await supabase
          .from('montadores')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setMontadorProfile(montadorData);
      } else if (profileData.role === 'client') {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setClienteProfile(clienteData);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMontadorProfile = async (data: Partial<MontadorProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('montadores')
      .insert({
        user_id: user.id,
        ...data
      });

    if (!error) {
      // Criar carteira
      await supabase
        .from('carteira')
        .insert({
          montador_id: (await supabase.from('montadores').select('id').eq('user_id', user.id).single()).data?.id
        });
      
      fetchProfile();
    }
    
    return { error };
  };

  const createClienteProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('clientes')
      .insert({
        user_id: user.id
      });

    if (!error) {
      fetchProfile();
    }

    return { error };
  };

  return {
    profile,
    montadorProfile,
    clienteProfile,
    loading,
    createMontadorProfile,
    createClienteProfile,
    refetch: fetchProfile
  };
}