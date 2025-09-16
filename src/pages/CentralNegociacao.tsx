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
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Central de Negociação</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Em Desenvolvimento
            </Badge>
          </div>

          <Card className="shadow-glow border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Sistema de Negociação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Sistema de negociação em desenvolvimento.
                </p>
                <p className="text-sm text-muted-foreground">
                  Job ID: {jobId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Usuário: {isCliente ? 'Cliente' : 'Montador'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CentralNegociacao;