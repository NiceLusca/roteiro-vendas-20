import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuditProvider } from "@/contexts/AuditContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Pipelines from "./pages/Pipelines";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound";
import { Auth } from "./pages/Auth";

// Lazy imports
const Agenda = lazy(() => import('./pages/Agenda'));
const Deals = lazy(() => import('./pages/Deals'));
const Orders = lazy(() => import('./pages/Orders'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuditProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Index />} />
              <Route path="pipelines" element={<Pipelines />} />
              <Route path="leads" element={<Leads />} />
              <Route path="agenda" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Agenda />
                </Suspense>
              } />
              <Route path="deals" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Deals />
                </Suspense>
              } />
              <Route path="orders" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Orders />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Reports />
                </Suspense>
              } />
              <Route path="analytics" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Analytics />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <Settings />
                </Suspense>
              } />
              <Route path="leads/:id" element={
                <Suspense fallback={<div>Carregando...</div>}>
                  <LeadDetail />
                </Suspense>
              } />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuditProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
