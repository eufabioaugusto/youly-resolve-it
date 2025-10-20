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

    console.log(`ViaCEP retornou:`, viaCepData);

    // Usar apenas cidade e estado para busca mais ampla e confiável
    const cidade = viaCepData.localidade;
    const uf = viaCepData.uf;
    const query = `${cidade}, ${uf}, Brasil`;
    
    console.log(`Buscando coordenadas para: ${query}`);
    
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Youly-App/1.0',
      },
    });

    const nominatimData = await nominatimResponse.json();

    if (nominatimData.length === 0) {
      console.error(`Nominatim não encontrou coordenadas para: ${query}`);
      return null;
    }

    const coords = {
      lat: parseFloat(nominatimData[0].lat),
      lng: parseFloat(nominatimData[0].lon),
    };
    
    console.log(`✅ Coordenadas encontradas para ${cidade}-${uf}:`, coords);
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
  return distancia;
}
