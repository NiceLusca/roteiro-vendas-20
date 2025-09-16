import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuditProvider } from "@/contexts/AuditContext";
import { AllLogsAuditProvider } from "@/contexts/AllLogsAuditContext";
import { CRMProvider } from "@/contexts/CRMContext";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContextSecure";
import { useAuth } from "@/contexts/AuthContextSecure";
import { GlobalKeyboardShortcuts } from "@/components/help/GlobalKeyboardShortcuts";
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
const Intelligence = lazy(() => import('./pages/Intelligence'));
const Help = lazy(() => import('./pages/Help'));
const Security = lazy(() => import('./pages/Security'));

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

function App() {
  return (
    <HelmetProvider>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CRMProvider>
              <AuditProvider>
                <AllLogsAuditProvider>
                  <TooltipProvider>
                    <SecurityHeaders environment={process.env.NODE_ENV as 'development' | 'production'} />
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <GlobalKeyboardShortcuts />
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
                          <Route path="intelligence" element={
                            <Suspense fallback={<div>Carregando...</div>}>
                              <Intelligence />
                            </Suspense>
                          } />
                          <Route path="settings" element={
                            <Suspense fallback={<div>Carregando...</div>}>
                              <Settings />
                            </Suspense>
                          } />
                          <Route path="security" element={
                            <Suspense fallback={<div>Carregando...</div>}>
                              <Security />
                            </Suspense>
                          } />
                          <Route path="leads/:id" element={
                            <Suspense fallback={<div>Carregando...</div>}>
                              <LeadDetail />
                            </Suspense>
                          } />
                          <Route path="help" element={
                            <Suspense fallback={<div>Carregando...</div>}>
                              <Help />
                            </Suspense>
                          } />
                        </Route>
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </AllLogsAuditProvider>
              </AuditProvider>
            </CRMProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
