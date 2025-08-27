import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuditProvider } from "@/contexts/AuditContext";
import Index from "./pages/Index";
import Pipelines from "./pages/Pipelines";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound";

// Lazy imports
const Agenda = lazy(() => import('./pages/Agenda'));
const Deals = lazy(() => import('./pages/Deals'));
const Orders = lazy(() => import('./pages/Orders'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuditProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
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
  </QueryClientProvider>
);

export default App;
