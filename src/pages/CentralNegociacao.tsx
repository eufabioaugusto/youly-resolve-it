import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, DollarSign, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const CentralNegociacao = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(false);
  
  const isCliente = profile?.role === 'client';
  const isMontador = profile?.role === 'montador';

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to={isCliente ? "/cliente" : "/montador"}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Central de Negociação</h1>
              <p className="text-white/80 mb-4">
                Negocie diretamente com o montador sobre preço e detalhes do serviço
              </p>
            </div>

            <Card className="shadow-glow border-0 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informações do Trabalho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sistema em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-4">
                    A central de negociação está sendo finalizada.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Job ID: {jobId}</p>
                    <p>Usuário: {isCliente ? 'Cliente' : 'Montador'}</p>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={() => navigate(isCliente ? "/cliente" : "/montador")}
                      className="bg-gradient-primary"
                    >
                      Voltar ao Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
};

export default CentralNegociacao;