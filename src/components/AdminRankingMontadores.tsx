import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Star, TrendingUp, Award } from 'lucide-react';
import { NivelBadge } from '@/components/ui/nivel-badge';

export function AdminRankingMontadores() {
  const [montadores, setMontadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('all');
  const [filtroRegiao, setFiltroRegiao] = useState('all');

  useEffect(() => {
    loadMontadores();
  }, []);

  const loadMontadores = async () => {
    console.log('🚀 [AdminRankingMontadores] Carregando montadores');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('montadores')
        .select('*, profiles:user_id(*)')
        .order('avaliacao_media', { ascending: false });

      if (error) throw error;

      console.log('✅ [AdminRankingMontadores] Montadores carregados', data);
      setMontadores(data || []);
    } catch (error) {
      console.error('❌ [AdminRankingMontadores] Erro ao carregar montadores', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMontadores = montadores.filter((m) => {
    if (filtroNivel !== 'all' && m.nivel_gamificacao !== filtroNivel) return false;
    // TODO: Implementar filtro por região quando houver campo de CEP/região no perfil
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Ranking de Montadores
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filtroNivel} onValueChange={setFiltroNivel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Hero">Hero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-center">Avaliação</TableHead>
              <TableHead className="text-center">Projetos</TableHead>
              <TableHead className="text-center">Assistências</TableHead>
              <TableHead className="text-center">Taxa Sucesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMontadores.map((montador, index) => (
              <TableRow key={montador.id}>
                <TableCell className="font-medium">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{montador.profiles?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {montador.total_avaliacoes || 0} avaliações
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <NivelBadge
                    nivel={montador.nivel_gamificacao || 'Bronze'}
                    isPremium={montador.is_premium || false}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {montador.avaliacao_media?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {montador.projetos_realizados || 0}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={montador.total_assistencias > 5 ? 'destructive' : 'secondary'}>
                    {montador.total_assistencias || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp
                      className={`w-4 h-4 ${
                        montador.taxa_conclusao_sucesso >= 90
                          ? 'text-success'
                          : montador.taxa_conclusao_sucesso >= 70
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}
                    />
                    <span className="font-medium">
                      {montador.taxa_conclusao_sucesso?.toFixed(0) || 0}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredMontadores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum montador encontrado com os filtros selecionados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
