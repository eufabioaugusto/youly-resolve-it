import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotificationCenter from "@/components/NotificationCenter";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <div className="fixed top-4 right-4 z-50">
            <NotificationCenter />
          </div>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/register" element={<AdminRegister />} />
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
              <Route path="/montador/negociacao/:jobId" element={
                <ProtectedRoute requiredRole="montador">
                  <CentralNegociacao />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;