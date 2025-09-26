import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, DollarSign, Clock, MapPin, Eye } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNegociacoes } from "@/hooks/useNegociacoes";

const CentralNegociacoes = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { negociacoes, loading } = useNegociacoes();
  
  const isCliente = profile?.role === 'client';

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "outline", text: "Aguardando orçamento" },
      orcamento_enviado: { variant: "default", text: "Orçamento recebido", className: "bg-warning text-warning-foreground" },
      aceito: { variant: "default", text: "Aceito", className: "bg-success text-success-foreground" },
      recusado: { variant: "destructive", text: "Recusado" },
      contra_proposta: { variant: "default", text: "Contra-proposta", className: "bg-info text-info-foreground" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Carregando negociações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to={isCliente ? "/cliente" : "/montador"}
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Central de Negociações</h1>
            <p className="text-muted-foreground">
              Acompanhe todas as suas negociações em andamento
            </p>
          </div>

          {negociacoes.length === 0 ? (
            <Card className="shadow-glow border-0 bg-white text-center p-8">
              <CardContent>
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma negociação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {isCliente 
                    ? "Você ainda não iniciou nenhuma negociação."
                    : "Você ainda não tem negociações ativas."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {negociacoes.map((negociacao) => (
                <Card key={negociacao.id} className="shadow-glow border-0 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        Negociação {negociacao.id.slice(0, 8)}
                      </CardTitle>
                      {getStatusBadge(negociacao.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>N</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Job ID: {negociacao.job_id}</p>
                          {negociacao.valor_proposto_montador && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              R$ {negociacao.valor_proposto_montador?.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => navigate(
                          isCliente 
                            ? `/cliente/negociacao/${negociacao.job_id}`
                            : `/montador/negociacao/${negociacao.job_id}`
                        )}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentralNegociacoes;