import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Pipelines from "./pages/Pipelines";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="leads" element={<Leads />} />
            <Route path="agenda" element={<lazy(() => import('./pages/Agenda'))} />
            <Route path="deals" element={<lazy(() => import('./pages/Deals'))} />
            <Route path="orders" element={<lazy(() => import('./pages/Orders'))} />
            <Route path="reports" element={<lazy(() => import('./pages/Reports'))} />
            <Route path="settings" element={<lazy(() => import('./pages/Settings'))} />
            <Route path="leads/:id" element={<lazy(() => import('./pages/LeadDetail'))} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
