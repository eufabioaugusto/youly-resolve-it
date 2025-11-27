// Função para buscar coordenadas de um CEP usando a API do ViaCEP + Nominatim
async function buscarCoordenadasPorCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Remover caracteres não numéricos do CEP
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      console.error(`CEP inválido: ${cep}`);
      return null;
    }

    // Buscar endereço pelo ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const viaCepData = await viaCepResponse.json();

    if (viaCepData.erro) {
      console.error(`CEP não encontrado no ViaCEP: ${cepLimpo}`);
      return null;
    }

    console.log(`📍 ViaCEP retornou para ${cepLimpo}:`, viaCepData);

    // Tentar busca precisa primeiro (logradouro + bairro + cidade)
    let query = '';
    let nominatimData: any[] = [];
    
    // Estratégia 1: Endereço completo (mais preciso)
    if (viaCepData.logradouro && viaCepData.bairro) {
      query = `${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
      console.log(`🎯 Tentando busca precisa: ${query}`);
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Youly-App/1.0',
        },
      });
      nominatimData = await nominatimResponse.json();
    }
    
    // Estratégia 2: Bairro + Cidade (fallback)
    if (nominatimData.length === 0 && viaCepData.bairro) {
      query = `${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
      console.log(`🔄 Tentando busca por bairro: ${query}`);
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Youly-App/1.0',
        },
      });
      nominatimData = await nominatimResponse.json();
    }
    
    // Estratégia 3: Apenas Cidade + Estado (último recurso)
    if (nominatimData.length === 0) {
      query = `${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
      console.log(`⚠️ Usando apenas cidade: ${query}`);
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Youly-App/1.0',
        },
      });
      nominatimData = await nominatimResponse.json();
    }

    if (nominatimData.length === 0) {
      console.error(`❌ Nominatim não encontrou coordenadas para CEP ${cepLimpo}`);
      return null;
    }

    const coords = {
      lat: parseFloat(nominatimData[0].lat),
      lng: parseFloat(nominatimData[0].lon),
    };
    
    console.log(`✅ Coordenadas encontradas para ${cepLimpo} (${viaCepData.bairro || viaCepData.localidade}):`, coords);
    return coords;
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error);
    return null;
  }
}

// Função para calcular distância entre duas coordenadas usando a fórmula de Haversine
function calcularDistanciaHaversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia;
}

// Função principal para calcular distância entre dois CEPs
export async function calcularDistanciaEntreCeps(cep1: string, cep2: string): Promise<number> {
  const [coord1, coord2] = await Promise.all([
    buscarCoordenadasPorCep(cep1),
    buscarCoordenadasPorCep(cep2),
  ]);

  if (!coord1 || !coord2) {
    throw new Error('Não foi possível obter coordenadas dos CEPs');
  }

  const distancia = calcularDistanciaHaversine(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
  // Arredondar para 1 casa decimal e garantir mínimo de 0.1km
  return Math.max(0.1, Math.round(distancia * 10) / 10);
}
