-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE status_geral AS ENUM ('lead', 'qualificado', 'reuniao_marcada', 'em_negociacao', 'cliente', 'perdido');
CREATE TYPE origem_lead AS ENUM ('indicacao', 'trafego_pago', 'organico', 'evento', 'outro');
CREATE TYPE objecao_principal AS ENUM ('preco', 'tempo', 'confianca', 'necessidade', 'outro');
CREATE TYPE status_appointment AS ENUM ('agendado', 'confirmado', 'realizado', 'cancelado', 'remarcado');
CREATE TYPE resultado_sessao AS ENUM ('positivo', 'neutro', 'negativo');
CREATE TYPE canal_interacao AS ENUM ('whatsapp', 'email', 'telefone', 'presencial', 'outro');
CREATE TYPE status_deal AS ENUM ('aberto', 'ganho', 'perdido');
CREATE TYPE status_pedido AS ENUM ('pendente', 'pago', 'cancelado');
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Pipelines table
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active pipelines" ON pipelines FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY "Admins can manage pipelines" ON pipelines FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Pipeline stages table
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  sla_horas INTEGER,
  proximo_passo_tipo TEXT,
  proximo_passo_template TEXT,
  criterios_avanco JSONB,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active stages" ON pipeline_stages FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY "Admins can manage stages" ON pipeline_stages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  origem origem_lead,
  status_geral status_geral DEFAULT 'lead',
  ja_vendeu_no_digital BOOLEAN,
  seguidores INTEGER,
  faturamento_medio DECIMAL,
  meta_faturamento DECIMAL,
  objecao_principal objecao_principal,
  lead_score INTEGER DEFAULT 0,
  observacoes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads" ON leads FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create leads" ON leads FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update leads" ON leads FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Lead pipeline entries
CREATE TABLE lead_pipeline_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  etapa_atual_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  status_inscricao TEXT DEFAULT 'ativo',
  data_inscricao TIMESTAMPTZ DEFAULT NOW(),
  data_entrada_etapa TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ,
  saude_etapa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lead_id, pipeline_id)
);

ALTER TABLE lead_pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view entries" ON lead_pipeline_entries FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create entries" ON lead_pipeline_entries FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update entries" ON lead_pipeline_entries FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete entries" ON lead_pipeline_entries FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active products" ON products FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  status status_appointment DEFAULT 'agendado',
  resultado_sessao resultado_sessao,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON appointments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update appointments" ON appointments FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete appointments" ON appointments FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  canal canal_interacao NOT NULL,
  descricao TEXT NOT NULL,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interactions" ON interactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create interactions" ON interactions FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Admins can delete interactions" ON interactions FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES products(id) ON DELETE SET NULL,
  valor_proposto DECIMAL NOT NULL,
  status status_deal DEFAULT 'aberto',
  data_fechamento TIMESTAMPTZ,
  motivo_perda TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deals" ON deals FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create deals" ON deals FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update deals" ON deals FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete deals" ON deals FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  valor_total DECIMAL NOT NULL,
  status_pagamento status_pedido DEFAULT 'pendente',
  data_pedido TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders" ON orders FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update orders" ON orders FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL NOT NULL,
  recorrencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view order items" ON order_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create order items" ON order_items FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Admins can delete order items" ON order_items FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Stage checklist items
CREATE TABLE stage_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT FALSE,
  ordem INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stage_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view checklist items" ON stage_checklist_items FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY "Admins can manage checklist items" ON stage_checklist_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  ator TEXT,
  alteracao JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Security events table
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events" ON security_events FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create security events" ON security_events FOR INSERT WITH CHECK (TRUE);

-- Advancement criteria table
CREATE TABLE advancement_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  campo TEXT,
  operador TEXT,
  valor_esperado TEXT,
  obrigatorio BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE advancement_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view criteria" ON advancement_criteria FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY "Admins can manage criteria" ON advancement_criteria FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lead criteria states table
CREATE TABLE lead_criteria_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  criterio_id UUID REFERENCES advancement_criteria(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  valor_validacao TEXT,
  validado_em TIMESTAMPTZ,
  validado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lead_id, criterio_id)
);

ALTER TABLE lead_criteria_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view criteria states" ON lead_criteria_states FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can manage criteria states" ON lead_criteria_states FOR ALL TO authenticated USING (TRUE);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_pipeline_entries_updated_at BEFORE UPDATE ON lead_pipeline_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stage_checklist_items_updated_at BEFORE UPDATE ON stage_checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advancement_criteria_updated_at BEFORE UPDATE ON advancement_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_criteria_states_updated_at BEFORE UPDATE ON lead_criteria_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();