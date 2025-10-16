import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Users, Shield, Star, CheckCircle, Clock, MapPin, Smartphone } from "lucide-react";
import { useEffect, useRef } from "react";

const logos = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/2560px-Ikea_logo.svg.png",
  "https://logodownload.org/wp-content/uploads/2019/11/tok-stok-logo.png",
  "https://logodownload.org/wp-content/uploads/2014/06/magalu-logo-1.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1280px-Amazon_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Casas_Bahia_logo_2020.svg/2560px-Casas_Bahia_logo_2020.svg.png",
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSbOrww9sXArBccJEf8aIFq45tiUTlw8itUjrYBWohhg4NeRdGXcUxuwtoT2jz9qjAFTjxJWXyxdY6McVtl6aWSVMNxig2rN6Cs-u7Hydov5pJz_nV1jHXzMohSBWij7npsOVX/s1600/etna+logo.jpg",
  "https://logodownload.org/wp-content/uploads/2017/05/leroy-merlin-logo.png",
];

const Index = () => {
  // Carrossel infinito suave (JS) — sem flicker e sem style-jsx
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let x = 0;
    const speed = 0.5; // ajuste fino de velocidade

    const animate = () => {
      x -= speed;
      const width = track.scrollWidth / 2; // metade (porque duplicamos os logos)
      if (Math.abs(x) >= width) x = 0;
      track.style.transform = `translateX(${x}px)`;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://storage.googleapis.com/gpt-engineer-file-uploads/HuLLY2XYTgNcG9iwF9oWsCLkpi53/social-images/social-1758541291424-Youly-Logo.png"
              alt="Youly Logo"
              className="h-9 object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="#" className="text-sm hover:text-primary transition-colors">
              Como funciona
            </Link>
            <Link to="#" className="text-sm hover:text-primary transition-colors">
              Para empresas
            </Link>
            <Link to="/login" className="text-sm hover:text-primary transition-colors">
              Entrar
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/register">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ======================= HERO (Impact + imagem) ======================= */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 items-center gap-12">
          {/* Lado esquerdo: texto */}
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5">
              🚀 Nova plataforma de serviços
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Chamou. <span className="opacity-90">Resolveu.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl">
              Conecte-se a montadores verificados, agende na hora e ative a garantia de 30 dias. Rápido, seguro e do seu
              jeito.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" className="hover:shadow-glow" asChild>
                <Link to="/register?type=client" className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quero contratar
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/10"
                asChild
              >
                <Link to="/register?type=worker" className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Quero trabalhar
                </Link>
              </Button>
            </div>

            {/* Chips de prova social no hero */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-sm opacity-90">Montadores verificados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">5000+</div>
                <div className="text-sm opacity-90">Móveis montados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">4.9★</div>
                <div className="text-sm opacity-90">Avaliação média</div>
              </div>
            </div>
          </div>

          {/* Lado direito: imagem (garante renderização) */}
          <div className="relative">
            <img
              src="/images/hero-youly-1.png"
              alt="Montador profissional"
              className="w-full object-cover shadow-xl"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Bolhas decorativas */}
        <div className="pointer-events-none absolute -right-20 top-20 hidden md:block">
          <div className="size-44 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
        <div className="pointer-events-none absolute right-10 bottom-10 hidden md:block">
          <div className="size-24 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
      </section>

      {/* ======================= 1) SCROLL DE MARCAS (loop infinito) ======================= */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10" />

          {/* trilho duplicado para loop */}
          <div className="will-change-transform" ref={trackRef} style={{ display: "flex", gap: "2.5rem" }}>
            {[...logos, ...logos].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Logo ${i}`}
                className="h-4 md:h-6 object-contain opacity-80 hover:opacity-100 hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ======================= 2) BANNER CENTRAL (stat grande) ======================= */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-r from-[#E53935] to-[#FF7043] p-6 md:p-10 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-5xl md:text-6xl font-extrabold tracking-tight">+5.000</div>
                <div className="text-2xl md:text-3xl font-semibold mt-2">móveis já montados pela rede YOULY</div>
                <p className="mt-4 text-white/90">
                  Garantia de 30 dias em todos os serviços. Segurança, velocidade e avaliação real.
                </p>
              </div>
              {/* mock visual tipo “dashboard” */}
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <div className="h-40 md:h-48 rounded-lg bg-white/20" />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="h-16 rounded-lg bg-white/20" />
                  <div className="h-16 rounded-lg bg-white/20" />
                  <div className="h-16 rounded-lg bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 3) BOX CTA 2 PÚBLICOS ======================= */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Escolha como quer usar a YOULY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">Sou Cliente</h3>
                  <p className="text-muted-foreground mt-1">
                    Encontre um montador verificado, compare propostas e ative a garantia.
                  </p>
                </div>
                <Button asChild className="bg-gradient-primary">
                  <Link to="/register?type=client">Quero contratar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <Wrench className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">Sou Montador</h3>
                  <p className="text-muted-foreground mt-1">
                    Receba trabalhos na sua região, com pagamentos seguros e avaliações reais.
                  </p>
                </div>
                <Button asChild variant="outline" className="hover:bg-primary/10">
                  <Link to="/register?type=worker">Quero trabalhar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ======================= 4) SESSÃO GRADIENTE – 3 BENEFÍCIOS ======================= */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5B9BFF] via-[#7B6CFF] to-[#D64FFF] opacity-90" />
        <div className="relative container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            O jeito mais rápido e seguro de montar seus móveis
          </h2>
          <p className="text-white/90 text-center mb-12">
            Você escolhe o profissional, acompanha tudo e ainda tem garantia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white rounded-2xl border-0">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verificação e confiança</h3>
                <p className="text-muted-foreground">
                  Profissionais checados e avaliações públicas — você contrata com segurança.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border-0">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Agilidade real</h3>
                <p className="text-muted-foreground">
                  Agende entre 3 opções de data/horário e acompanhe tudo pelo app/web.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border-0">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Garantia de 30 dias</h3>
                <p className="text-muted-foreground">
                  Serviço com garantia ativada após a conclusão. Precisou? A gente resolve.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register?type=client">Explorar serviços</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================= 5) 3 SESSÕES SIDE-BY-SIDE ======================= */}
      <section className="py-24">
        <div className="container mx-auto px-4 space-y-20">
          {/* Passo 1: Imagem + Texto */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl bg-muted h-72 md:h-96">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">
                Passo 1
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Descreva seu projeto</h3>
              <p className="text-muted-foreground mb-6">
                Informe o tipo de móvel, suba a nota fiscal e defina até 3 datas/horários preferidos.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Atendimento na sua região
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Processo 100% online
                </div>
              </div>
            </div>
          </div>

          {/* Passo 2: Texto + Imagem */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <Badge variant="secondary" className="mb-3">
                Passo 2
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Escolha seu montador</h3>
              <p className="text-muted-foreground mb-6">
                Compare propostas, veja avaliações reais e convide diretamente quem você preferir.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" /> Avaliações transparentes
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Profissionais verificados
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 rounded-2xl bg-muted h-72 md:h-96">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5" />
            </div>
          </div>

          {/* Passo 3: Imagem + Texto */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl bg-muted h-72 md:h-96">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">
                Passo 3
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Serviço realizado</h3>
              <p className="text-muted-foreground mb-6">
                Pagamento seguro na plataforma, execução profissional e garantia de 30 dias ativada.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Garantia ativa
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Agendamento rápido
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 6) PRÉ-FOOTER (CTA curto) ======================= */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Pronto para resolver hoje?</h3>
          <p className="text-muted-foreground mb-8">Leva menos de 2 minutos para publicar seu projeto.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary" asChild>
              <Link to="/register?type=client">Contratar agora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register?type=worker">Quero trabalhar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================= 7) FOOTER (atual) ======================= */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                  <Wrench className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-bold">YOULY</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma que conecta você aos melhores prestadores de serviço.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Para clientes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Como contratar
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Garantia
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Para montadores</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Como trabalhar
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Requisitos
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Pagamentos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 YOULY. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
