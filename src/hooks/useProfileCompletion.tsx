import { useProfile } from './useProfile';

export function useProfileCompletion() {
  const { profile, montadorProfile } = useProfile();

  const isProfileComplete = () => {
    if (!profile || !montadorProfile) return false;

    // Verificar dados básicos
    if (!profile.nome || !profile.telefone || !profile.documento) return false;
    
    // Verificar endereço
    if (!profile.endereco || 
        !profile.endereco.rua || 
        !profile.endereco.numero || 
        !profile.endereco.bairro || 
        !profile.endereco.cidade || 
        !profile.endereco.cep || 
        !profile.endereco.estado) {
      return false;
    }

    // Verificar dados do montador
    if (!montadorProfile.preco_hora || 
        !montadorProfile.especialidades || 
        montadorProfile.especialidades.length === 0) {
      return false;
    }

    // Verificar chave PIX (será adicionada)
    if (!montadorProfile.chave_pix) return false;

    return true;
  };

  return {
    isComplete: isProfileComplete(),
    profile,
    montadorProfile
  };
}