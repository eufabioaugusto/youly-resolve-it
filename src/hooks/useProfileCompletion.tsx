import { useMemo } from 'react';
import { useProfile } from './useProfile';

export function useProfileCompletion() {
  const { profile, montadorProfile } = useProfile();

  const isComplete = useMemo(() => {
    if (!profile || !montadorProfile) return false;

    // Verificar dados básicos
    if (!profile.nome || !profile.telefone || !profile.documento) return false;
    
    // Verificar endereço - removemos a verificação do estado que pode estar faltando
    if (!profile.endereco || 
        !profile.endereco.rua || 
        !profile.endereco.numero || 
        !profile.endereco.bairro || 
        !profile.endereco.cidade || 
        !profile.endereco.cep) {
      return false;
    }

    // Verificar dados do montador
    if (!montadorProfile.preco_hora || 
        !montadorProfile.especialidades || 
        montadorProfile.especialidades.length === 0) {
      return false;
    }

    // Verificar chave PIX
    if (!montadorProfile.chave_pix) return false;

    return true;
  }, [profile, montadorProfile]);

  return {
    isComplete,
    profile,
    montadorProfile
  };
}