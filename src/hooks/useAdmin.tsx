import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  user_id: string;
  nome: string;
  role: string;
  created_at: string;
  telefone?: string;
}

export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nome, role, created_at, telefone')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar usuários: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('promote_to_admin', {
        target_user_id: userId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador com sucesso!",
      });

      // Refresh the users list
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao promover usuário: " + error.message,
      });
      return false;
    }
  };

  const isAdminUser = async (userId?: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        user_uuid: userId || undefined
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    promoteToAdmin,
    isAdminUser,
  };
}