-- CRM Database Schema Migration
-- Creating all tables for the comprehensive CRM system

-- Create enums for type safety
CREATE TYPE public.status_geral AS ENUM ('Ativo', 'Cliente', 'Perdido', 'Inativo');
CREATE TYPE public.origem_lead AS ENUM ('Facebook', 'Instagram', 'Google', 'Indicação', 'Orgânico', 'WhatsApp', 'LinkedIn', 'Evento', 'Outro');
CREATE TYPE public.objecao_principal AS ENUM ('Preço', 'Tempo', 'Prioridade', 'Confiança', 'Sem Fit', 'Orçamento', 'Decisor', 'Concorrente', 'Outro');
CREATE TYPE public.status_appointment AS ENUM ('Agendado', 'Realizado', 'Cancelado', 'Remarcado', 'No-Show');
CREATE TYPE public.resultado_sessao AS ENUM ('Avançar', 'Não Avançar', 'Recuperação', 'Cliente', 'Outro');
CREATE TYPE public.canal_interacao AS ENUM ('WhatsApp', 'Ligação', 'Email', 'Presencial', 'Notas', 'Sessão');
CREATE TYPE public.status_deal AS ENUM ('Aberta', 'Ganha', 'Perdida');
CREATE TYPE public.status_pedido AS ENUM ('Pago', 'Pendente', 'Reembolsado', 'Estornado');
CREATE TYPE public.saude_etapa AS ENUM ('Verde', 'Amarelo', 'Vermelho');
CREATE TYPE public.proximo_passo_tipo AS ENUM ('Humano', 'Agendamento', 'Mensagem', 'Outro');
CREATE TYPE public.lead_score_class AS ENUM ('Alto', 'Médio', 'Baixo');
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'closer', 'user');
CREATE TYPE public.produto_tipo AS ENUM ('Mentoria', 'Curso', 'Plano', 'Consultoria', 'Outro');
CREATE TYPE public.recorrencia AS ENUM ('Nenhuma', 'Mensal', 'Trimestral', 'Anual');

-- ======================================
-- 1. USER PROFILES AND ROLES
-- ======================================

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- ======================================
-- 2. LEADS MANAGEMENT
-- ======================================

-- Main leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT NOT NULL, -- Normalized +55DDDNUMBER
    origem public.origem_lead NOT NULL,
    segmento TEXT,
    status_geral public.status_geral NOT NULL DEFAULT 'Ativo',
    closer TEXT,
    desejo_na_sessao TEXT,
    objecao_principal public.objecao_principal,
    objecao_obs TEXT,
    observacoes TEXT,
    
    -- Profile/Scoring
    ja_vendeu_no_digital BOOLEAN DEFAULT FALSE,
    seguidores INTEGER DEFAULT 0,
    faturamento_medio DECIMAL(15,2) DEFAULT 0,
    meta_faturamento DECIMAL(15,2) DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    lead_score_classification public.lead_score_class DEFAULT 'Baixo',
    
    -- Last session result
    resultado_sessao_ultimo public.resultado_sessao,
    resultado_obs_ultima_sessao TEXT,
    
    -- Metadata
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead form submissions
CREATE TABLE public.lead_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    payload JSONB NOT NULL,
    origem_form TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 3. PIPELINE SYSTEM
-- ======================================

-- Pipelines
CREATE TABLE public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    objetivo TEXT,
    primary_pipeline BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline stages
CREATE TABLE public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    prazo_em_dias INTEGER NOT NULL DEFAULT 7,
    
    -- Next step configuration
    proximo_passo_label TEXT,
    proximo_passo_tipo public.proximo_passo_tipo DEFAULT 'Humano',
    
    -- Automatic actions
    gerar_agendamento_auto BOOLEAN DEFAULT FALSE,
    duracao_minutos INTEGER,
    
    -- Criteria
    entrada_criteria TEXT,
    saida_criteria TEXT,
    
    -- WIP limit
    wip_limit INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (pipeline_id, ordem)
);

-- Stage checklist items
CREATE TABLE public.stage_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    obrigatorio BOOLEAN DEFAULT FALSE,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (stage_id, ordem)
);

-- Lead pipeline entries (where leads are positioned)
CREATE TABLE public.lead_pipeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE NOT NULL,
    etapa_atual_id UUID REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT NOT NULL,
    status_inscricao TEXT DEFAULT 'Ativo' CHECK (status_inscricao IN ('Ativo', 'Arquivado')),
    
    -- Dates and SLA
    data_entrada_etapa TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_prevista_proxima_etapa TIMESTAMP WITH TIME ZONE,
    
    -- Calculated metrics
    tempo_em_etapa_dias INTEGER DEFAULT 0,
    dias_em_atraso INTEGER DEFAULT 0,
    saude_etapa public.saude_etapa DEFAULT 'Verde',
    
    -- Checklist and notes
    checklist_state JSONB DEFAULT '{}',
    nota_etapa TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (lead_id, pipeline_id)
);

-- Pipeline events (movement history)
CREATE TABLE public.pipeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_pipeline_entry_id UUID REFERENCES public.lead_pipeline_entries(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Criado', 'Avancado', 'Regressado', 'Transferido', 'Arquivado')),
    de_etapa_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    para_etapa_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    ator TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detalhes JSONB
);

-- ======================================
-- 4. APPOINTMENTS AND INTERACTIONS
-- ======================================

-- Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.status_appointment DEFAULT 'Agendado',
    origem TEXT DEFAULT 'Plataforma' CHECK (origem IN ('Plataforma', 'Importado', 'Outro')),
    resultado_sessao public.resultado_sessao,
    resultado_obs TEXT,
    observacao TEXT,
    criado_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment events (history)
CREATE TABLE public.appointment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Criado', 'Reagendado', 'Cancelado', 'Realizado', 'StatusAlterado')),
    antes JSONB,
    depois JSONB,
    ator TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    canal public.canal_interacao NOT NULL,
    conteudo TEXT NOT NULL,
    autor TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 5. PRODUCTS AND SALES
-- ======================================

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo public.produto_tipo NOT NULL,
    recorrencia public.recorrencia DEFAULT 'Nenhuma',
    preco_padrao DECIMAL(15,2) NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    closer TEXT,
    valor_proposto DECIMAL(15,2) NOT NULL DEFAULT 0,
    status public.status_deal DEFAULT 'Aberta',
    fase_negociacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal lost reasons
CREATE TABLE public.deal_lost_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    motivo public.objecao_principal NOT NULL,
    detalhes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    closer TEXT,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    forma_pagamento TEXT,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status public.status_pedido DEFAULT 'Pendente',
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    valor DECIMAL(15,2) NOT NULL DEFAULT 0,
    quantidade INTEGER NOT NULL DEFAULT 1,
    recorrencia public.recorrencia DEFAULT 'Nenhuma',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    valor DECIMAL(15,2) NOT NULL DEFAULT 0,
    motivo TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parcial BOOLEAN DEFAULT FALSE
);

-- ======================================
-- 6. AUDIT AND TRANSFERS
-- ======================================

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    alteracao JSONB NOT NULL,
    ator TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline transfers
CREATE TABLE public.pipeline_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    de_pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL NOT NULL,
    para_pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL NOT NULL,
    de_etapa_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    para_etapa_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    motivo TEXT NOT NULL,
    ator TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- INDEXES FOR PERFORMANCE
-- ======================================

-- Leads indexes
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status_geral ON public.leads(status_geral);
CREATE INDEX idx_leads_origem ON public.leads(origem);
CREATE INDEX idx_leads_whatsapp ON public.leads(whatsapp);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);

-- Pipeline indexes
CREATE INDEX idx_pipeline_entries_lead_id ON public.lead_pipeline_entries(lead_id);
CREATE INDEX idx_pipeline_entries_pipeline_id ON public.lead_pipeline_entries(pipeline_id);
CREATE INDEX idx_pipeline_entries_etapa_atual ON public.lead_pipeline_entries(etapa_atual_id);
CREATE INDEX idx_pipeline_entries_status ON public.lead_pipeline_entries(status_inscricao);

-- Events indexes
CREATE INDEX idx_pipeline_events_entry_id ON public.pipeline_events(lead_pipeline_entry_id);
CREATE INDEX idx_pipeline_events_timestamp ON public.pipeline_events(timestamp);
CREATE INDEX idx_appointment_events_appointment_id ON public.appointment_events(appointment_id);

-- Interactions indexes
CREATE INDEX idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX idx_interactions_timestamp ON public.interactions(timestamp);

-- Appointments indexes
CREATE INDEX idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX idx_appointments_start_at ON public.appointments(start_at);

-- Deals indexes
CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX idx_deals_status ON public.deals(status);

-- Orders indexes
CREATE INDEX idx_orders_lead_id ON public.orders(lead_id);
CREATE INDEX idx_orders_data_venda ON public.orders(data_venda);

-- Audit indexes
CREATE INDEX idx_audit_logs_entidade ON public.audit_logs(entidade, entidade_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- ======================================
-- ENABLE ROW LEVEL SECURITY
-- ======================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_pipeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_transfers ENABLE ROW LEVEL SECURITY;

-- ======================================
-- SECURITY FUNCTION FOR ROLE CHECKING
-- ======================================

-- Function to check user roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ======================================
-- ROW LEVEL SECURITY POLICIES
-- ======================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User roles policies (admin only)
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Leads policies (user can see their own leads)
CREATE POLICY "Users can view their leads" ON public.leads
    FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create leads" ON public.leads
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their leads" ON public.leads
    FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Lead form submissions (inherit from leads)
CREATE POLICY "Users can view form submissions for their leads" ON public.lead_form_submissions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = lead_form_submissions.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Pipelines policies
CREATE POLICY "Users can view their pipelines" ON public.pipelines
    FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their pipelines" ON public.pipelines
    FOR ALL USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Pipeline stages (inherit from pipelines)
CREATE POLICY "Users can access stages of their pipelines" ON public.pipeline_stages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.pipelines 
        WHERE pipelines.id = pipeline_stages.pipeline_id 
        AND (pipelines.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Similar policies for other tables...
CREATE POLICY "Users can access checklist items" ON public.stage_checklist_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.pipeline_stages ps
        JOIN public.pipelines p ON p.id = ps.pipeline_id
        WHERE ps.id = stage_checklist_items.stage_id 
        AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

CREATE POLICY "Users can access their lead pipeline entries" ON public.lead_pipeline_entries
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = lead_pipeline_entries.lead_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

CREATE POLICY "Users can access pipeline events" ON public.pipeline_events
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.lead_pipeline_entries lpe
        JOIN public.leads l ON l.id = lpe.lead_id
        WHERE lpe.id = pipeline_events.lead_pipeline_entry_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Appointments policies
CREATE POLICY "Users can access appointments for their leads" ON public.appointments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = appointments.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Similar policies for remaining tables (interactions, products, deals, orders, etc.)
CREATE POLICY "Users can access interactions for their leads" ON public.interactions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = interactions.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

CREATE POLICY "Users can manage their products" ON public.products
    FOR ALL USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can access deals for their leads" ON public.deals
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = deals.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- ======================================
-- TRIGGERS FOR UPDATED_AT
-- ======================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
    BEFORE UPDATE ON public.pipeline_stages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_pipeline_entries_updated_at
    BEFORE UPDATE ON public.lead_pipeline_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();