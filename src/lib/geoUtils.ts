// Cache de coordenadas no localStorage
const CACHE_KEY = 'youly_coords_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface CoordCache {
  [cep: string]: {
    coords: { lat: number; lng: number };
    timestamp: number;
  };
}

function getCachedCoords(cep: string): { lat: number; lng: number } | null {
  try {
    const cache: CoordCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[cep];
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Coordenadas do cache para ${cep}:`, cached.coords);
      return cached.coords;
    }
  } catch (error) {
    console.error('Erro ao ler cache:', error);
  }
  return null;
}

function setCachedCoords(cep: string, coords: { lat: number; lng: number }): void {
  try {
    const cache: CoordCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[cep] = {
      coords,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

// Controle de rate limiting para Nominatim (1 req/segundo)
let lastNominatimRequest = 0;
const NOMINATIM_DELAY = 1100; // 1.1 segundos entre requisições

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastNominatimRequest;
  
  if (timeSinceLastRequest < NOMINATIM_DELAY) {
    const waitTime = NOMINATIM_DELAY - timeSinceLastRequest;
    console.log(`⏳ Aguardando ${waitTime}ms para rate limit...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastNominatimRequest = Date.now();
}

// Função para buscar coordenadas de um CEP usando a API do ViaCEP + Nominatim
async function buscarCoordenadasPorCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Remover caracteres não numéricos do CEP
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      console.error(`CEP inválido: ${cep}`);
      return null;
    }

    // Verificar cache primeiro
    const cached = getCachedCoords(cepLimpo);
    if (cached) {
      return cached;
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
      
      await waitForRateLimit();
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
      
      await waitForRateLimit();
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
      
      await waitForRateLimit();
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
    
    // Salvar no cache
    setCachedCoords(cepLimpo, coords);
    
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
