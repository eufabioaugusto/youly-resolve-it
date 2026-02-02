import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import NotificationTopBar from "@/components/NotificationTopBar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ComoFunciona from "./pages/ComoFunciona";
import ParaEmpresas from "./pages/ParaEmpresas";
import ComoContratar from "./pages/ComoContratar";
import Garantia from "./pages/Garantia";
import Suporte from "./pages/Suporte";
import ComoTrabalhar from "./pages/ComoTrabalhar";
import Requisitos from "./pages/Requisitos";
import Pagamentos from "./pages/Pagamentos";
import SobreNos from "./pages/SobreNos";
import TermosUso from "./pages/TermosUso";
import Privacidade from "./pages/Privacidade";
import AdminRegister from "./pages/AdminRegister";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
import CentralNegociacao from "./pages/CentralNegociacao";
import CentralNegociacoes from "./pages/CentralNegociacoes";
import WorkerDashboard from "./pages/WorkerDashboard";
import MontadorProfile from "./pages/MontadorProfile";
import AdminDashboard from "./pages/AdminDashboard";
import CreateJob from "./pages/CreateJob";
import AvailableJobs from "./pages/AvailableJobs";
import JobCandidates from "./pages/JobCandidates";
import SuggestedMontadores from "./pages/SuggestedMontadores";
import PagamentoSucesso from "./pages/PagamentoSucesso";
import PagamentoFalha from "./pages/PagamentoFalha";
import PesquisaSatisfacao from "./pages/PesquisaSatisfacao";
import OrdemServicoPage from "./pages/OrdemServicoPage";
import Notificacoes from "./pages/Notificacoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationTopBar />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route path="/reset-senha" element={<ResetPassword />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/para-empresas" element={<ParaEmpresas />} />
              <Route path="/como-contratar" element={<ComoContratar />} />
              <Route path="/garantia" element={<Garantia />} />
              <Route path="/suporte" element={<Suporte />} />
              <Route path="/como-trabalhar" element={<ComoTrabalhar />} />
              <Route path="/requisitos" element={<Requisitos />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/sobre-nos" element={<SobreNos />} />
              <Route path="/termos-uso" element={<TermosUso />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/cliente" element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/cliente/perfil" element={
                <ProtectedRoute requiredRole="client">
                  <ClientProfile />
                </ProtectedRoute>
              } />
              <Route path="/cliente/negociacoes" element={
                <ProtectedRoute requiredRole="client">
                  <CentralNegociacoes />
                </ProtectedRoute>
              } />
              <Route path="/cliente/negociacao/:jobId" element={
                <ProtectedRoute requiredRole="client">
                  <CentralNegociacao />
                </ProtectedRoute>
              } />
              <Route path="/cliente/os/:osId" element={
                <ProtectedRoute requiredRole="client">
                  <OrdemServicoPage />
                </ProtectedRoute>
              } />
              <Route path="/cliente/notificacoes" element={
                <ProtectedRoute requiredRole="client">
                  <Notificacoes />
                </ProtectedRoute>
              } />
              <Route path="/montador" element={
                <ProtectedRoute requiredRole="montador">
                  <WorkerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/montador/perfil" element={
                <ProtectedRoute requiredRole="montador">
                  <MontadorProfile />
                </ProtectedRoute>
              } />
              <Route path="/montador/negociacoes" element={
                <ProtectedRoute requiredRole="montador">
                  <CentralNegociacoes />
                </ProtectedRoute>
              } />
              <Route path="/montador/negociacao/:jobId" element={
                <ProtectedRoute requiredRole="montador">
                  <CentralNegociacao />
                </ProtectedRoute>
              } />
              <Route path="/montador/os/:osId" element={
                <ProtectedRoute requiredRole="montador">
                  <OrdemServicoPage />
                </ProtectedRoute>
              } />
              <Route path="/montador/notificacoes" element={
                <ProtectedRoute requiredRole="montador">
                  <Notificacoes />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/criar-pedido" element={
                <ProtectedRoute requiredRole="client">
                  <CreateJob />
                </ProtectedRoute>
              } />
              <Route path="/pedido/:jobId/candidatos" element={
                <ProtectedRoute requiredRole="client">
                  <JobCandidates />
                </ProtectedRoute>
              } />
              <Route path="/trabalhos-disponiveis" element={
                <ProtectedRoute requiredRole="montador">
                  <AvailableJobs />
                </ProtectedRoute>
              } />
              <Route path="/pedido/:jobId/montadores-sugeridos" element={
                <ProtectedRoute requiredRole="client">
                  <SuggestedMontadores />
                </ProtectedRoute>
              } />
              <Route path="/trabalhos-sugeridos/:jobId" element={
                <ProtectedRoute requiredRole="client">
                  <SuggestedMontadores />
                </ProtectedRoute>
              } />
              <Route path="/pagamento/sucesso" element={<PagamentoSucesso />} />
              <Route path="/pagamento/falha" element={<PagamentoFalha />} />
              <Route path="/pagamento/pendente" element={<PagamentoSucesso />} />
              
              <Route path="/pesquisa/:token" element={<PesquisaSatisfacao />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;