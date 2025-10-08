import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContextSecure";
import { useAuth } from "@/contexts/AuthContextSecure";
import { GlobalKeyboardShortcuts } from "@/components/help/GlobalKeyboardShortcuts";
import Index from "./pages/Index";
import Pipelines from "./pages/Pipelines";
import PipelineSelector from "./pages/PipelineSelector";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound";
import { Auth } from "./pages/Auth";
import { EnhancedInstallPrompt, InstallBanner } from "@/components/pwa/EnhancedInstallPrompt";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

// Lazy imports with enhanced loading
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
const Production = lazy(() => import('./pages/Production'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <EnhancedLoading 
        loading={true} 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <></>
      </EnhancedLoading>
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
            <TooltipProvider>
              <SecurityHeaders environment={process.env.NODE_ENV as 'development' | 'production'} />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <GlobalKeyboardShortcuts />
                <EnhancedInstallPrompt />
                <InstallBanner />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Index />} />
                    <Route path="pipelines/select" element={<PipelineSelector />} />
                    <Route path="pipelines/:pipelineId" element={<Pipelines />} />
                    <Route path="pipelines" element={<Navigate to="/pipelines/select" replace />} />
                    <Route path="leads" element={<Leads />} />
                          <Route path="agenda" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Agenda />
                            </Suspense>
                          } />
                          <Route path="deals" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Deals />
                            </Suspense>
                          } />
                          <Route path="orders" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Orders />
                            </Suspense>
                          } />
                          <Route path="reports" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Reports />
                            </Suspense>
                          } />
                          <Route path="analytics" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Analytics />
                            </Suspense>
                          } />
                          <Route path="intelligence" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Intelligence />
                            </Suspense>
                          } />
                          <Route path="settings" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Settings />
                            </Suspense>
                          } />
                          <Route path="security" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Security />
                            </Suspense>
                          } />
                          <Route path="production" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Production />
                            </Suspense>
                          } />
                          <Route path="leads/:id" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <LeadDetail />
                            </Suspense>
                          } />
                          <Route path="help" element={
                            <Suspense fallback={<EnhancedLoading loading={true}><></></EnhancedLoading>}>
                              <Help />
                            </Suspense>
                          } />
                        </Route>
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                  </BrowserRouter>
                </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
