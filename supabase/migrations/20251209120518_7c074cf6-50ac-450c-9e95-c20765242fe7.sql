-- Corrigir TODAS as duplicatas de ordem antes de criar constraint

-- Pipeline 1: Captação No Plan B - LUCAS (6390c374-a846-4874-b9af-13903d2cae86)
-- Ordem 6 duplicada: Fechou e Interesse alto
UPDATE pipeline_stages SET ordem = 10 WHERE id = '19457452-fa27-40ad-bd3a-456c7070f614'; -- Interesse alto -> 10
UPDATE pipeline_stages SET ordem = 11 WHERE id = 'cd7774fa-4533-4054-9508-745356450b43'; -- Declinou -> 11
UPDATE pipeline_stages SET ordem = 12 WHERE id = '85486be2-a34e-41fd-8852-adc6c079d175'; -- Perdido -> 12

-- Pipeline 2: HDL (656a1002-dac8-458b-81b9-19628cffe8d4)
-- Ordem 5 duplicada: Agendou e Link Enviado
UPDATE pipeline_stages SET ordem = 10 WHERE id = 'b3fb6712-cfe0-4695-807e-735ececc2def'; -- Link Enviado -> 10
UPDATE pipeline_stages SET ordem = 11 WHERE id = 'e89cbd9d-c56c-48b6-bbc1-207a833d67b4'; -- Fechou -> 11
UPDATE pipeline_stages SET ordem = 12 WHERE id = '4a854893-c254-4080-894a-01054bb2f7d1'; -- Declinou -> 12
UPDATE pipeline_stages SET ordem = 13 WHERE id = 'bad7036c-35ae-4c2e-9578-d01ab2244086'; -- Perdido -> 13

-- Pipeline 3: Mentoria Society (f3ee5926-dbc5-421f-b523-3c5793dc05ff)
-- Ordem 3, 8 e 9 duplicadas
UPDATE pipeline_stages SET ordem = 20 WHERE id = 'ba22fed3-261f-4b22-8be2-f0de2d7b95db'; -- Contrato Assinado -> 20
UPDATE pipeline_stages SET ordem = 21 WHERE id = '3263e222-c59f-4e0f-8a5b-5a929929ce40'; -- AGUARDANDO ESCOLHA -> 21
UPDATE pipeline_stages SET ordem = 22 WHERE id = 'f5b90a88-4eef-4780-a1cc-840dad50b1ce'; -- BOAS VINDAS -> 22
UPDATE pipeline_stages SET ordem = 23 WHERE id = '861afcbb-a741-4b66-ab86-f12f7db77bd4'; -- AGUARDANDO ACESSO -> 23
UPDATE pipeline_stages SET ordem = 24 WHERE id = '30038b12-77fd-4587-99e6-dae579dfc443'; -- IGOR AVALIA -> 24
UPDATE pipeline_stages SET ordem = 25 WHERE id = 'ba4b99f6-5fc7-4143-9542-c7bc8e577a0d'; -- Igor Aprovou -> 25
UPDATE pipeline_stages SET ordem = 26 WHERE id = '1d08be52-b71e-45e1-9a22-cc6edbe4d476'; -- CRIANDO PAGINA -> 26
UPDATE pipeline_stages SET ordem = 27 WHERE id = '336de025-b29e-40ac-abff-f889b5dcd683'; -- Igor Rejeitou -> 27
UPDATE pipeline_stages SET ordem = 28 WHERE id = '6875e00e-2dba-4b9a-964b-4e05836e4e2f'; -- VERIFICAR CONTAS -> 28
UPDATE pipeline_stages SET ordem = 29 WHERE id = 'a137a6d7-48d5-4859-bca5-3fe6612a39c2'; -- APROVAÇÃO -> 29

-- Agora renumerar sequencialmente cada pipeline
-- Pipeline 1
UPDATE pipeline_stages SET ordem = 7 WHERE id = '19457452-fa27-40ad-bd3a-456c7070f614'; 
UPDATE pipeline_stages SET ordem = 8 WHERE id = 'cd7774fa-4533-4054-9508-745356450b43';
UPDATE pipeline_stages SET ordem = 9 WHERE id = '85486be2-a34e-41fd-8852-adc6c079d175';

-- Pipeline 2
UPDATE pipeline_stages SET ordem = 6 WHERE id = 'b3fb6712-cfe0-4695-807e-735ececc2def';
UPDATE pipeline_stages SET ordem = 7 WHERE id = 'e89cbd9d-c56c-48b6-bbc1-207a833d67b4';
UPDATE pipeline_stages SET ordem = 8 WHERE id = '4a854893-c254-4080-894a-01054bb2f7d1';
UPDATE pipeline_stages SET ordem = 9 WHERE id = 'bad7036c-35ae-4c2e-9578-d01ab2244086';

-- Pipeline 3: manter ordem lógica baseada em created_at
UPDATE pipeline_stages SET ordem = 4 WHERE id = 'ba22fed3-261f-4b22-8be2-f0de2d7b95db'; -- Contrato Assinado
UPDATE pipeline_stages SET ordem = 5 WHERE id = '3263e222-c59f-4e0f-8a5b-5a929929ce40'; -- AGUARDANDO ESCOLHA
UPDATE pipeline_stages SET ordem = 6 WHERE id = 'f5b90a88-4eef-4780-a1cc-840dad50b1ce'; -- BOAS VINDAS
UPDATE pipeline_stages SET ordem = 7 WHERE id = '861afcbb-a741-4b66-ab86-f12f7db77bd4'; -- AGUARDANDO ACESSO
UPDATE pipeline_stages SET ordem = 8 WHERE id = '30038b12-77fd-4587-99e6-dae579dfc443'; -- IGOR AVALIA
UPDATE pipeline_stages SET ordem = 9 WHERE id = 'ba4b99f6-5fc7-4143-9542-c7bc8e577a0d'; -- Igor Aprovou
UPDATE pipeline_stages SET ordem = 10 WHERE id = '1d08be52-b71e-45e1-9a22-cc6edbe4d476'; -- CRIANDO PAGINA
UPDATE pipeline_stages SET ordem = 11 WHERE id = '336de025-b29e-40ac-abff-f889b5dcd683'; -- Igor Rejeitou
UPDATE pipeline_stages SET ordem = 12 WHERE id = '6875e00e-2dba-4b9a-964b-4e05836e4e2f'; -- VERIFICAR CONTAS
UPDATE pipeline_stages SET ordem = 13 WHERE id = 'a137a6d7-48d5-4859-bca5-3fe6612a39c2'; -- APROVAÇÃO

-- Criar função para reordenação automática
CREATE OR REPLACE FUNCTION public.reorder_pipeline_stages()
RETURNS TRIGGER AS $$
DECLARE
  has_conflict BOOLEAN;
BEGIN
  -- Verificar se há conflito de ordem
  SELECT EXISTS(
    SELECT 1 FROM pipeline_stages
    WHERE pipeline_id = NEW.pipeline_id
      AND ordem = NEW.ordem
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND ativo = true
  ) INTO has_conflict;
  
  -- Se houver conflito, incrementar todas as etapas >= ordem inserida
  IF has_conflict THEN
    UPDATE pipeline_stages
    SET ordem = ordem + 1
    WHERE pipeline_id = NEW.pipeline_id
      AND ordem >= NEW.ordem
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND ativo = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_reorder_pipeline_stages ON pipeline_stages;
CREATE TRIGGER trigger_reorder_pipeline_stages
BEFORE INSERT OR UPDATE OF ordem ON pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION reorder_pipeline_stages();

-- Adicionar constraint UNIQUE
ALTER TABLE pipeline_stages DROP CONSTRAINT IF EXISTS unique_pipeline_stage_order;
ALTER TABLE pipeline_stages ADD CONSTRAINT unique_pipeline_stage_order 
UNIQUE (pipeline_id, ordem) DEFERRABLE INITIALLY DEFERRED;