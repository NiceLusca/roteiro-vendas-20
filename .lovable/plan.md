

## Plano: Configurar Etapas do Pipeline Comercial

### Objetivo
Criar e configurar as 13 etapas do pipeline Comercial com agrupamento visual e cores distintas por fase.

---

### Estrutura das Etapas

| # | Etapa | Grupo | Cor | Prazo (dias) |
|---|-------|-------|-----|--------------|
| 1 | Agendado | Pré-Sessão | `#3B82F6` (azul) | 3 |
| 2 | Confirmado | Pré-Sessão | `#3B82F6` | 2 |
| 3 | Remarcou | Pré-Sessão | `#3B82F6` | 3 |
| 4 | No-Show | Pré-Sessão | `#3B82F6` | 2 |
| 5 | Sessão Realizada | Sessão | `#8B5CF6` (violeta) | 1 |
| 6 | Fechou | Decisão | `#A855F7` (roxo) | 1 |
| 7 | Não Fechou (quente) | Decisão | `#A855F7` | 2 |
| 8 | Não Fechou (frio) | Decisão | `#A855F7` | 7 |
| 9 | Recuperação D+2 | Recuperação | `#F97316` (laranja) | 2 |
| 10 | Recuperação D+4 | Recuperação | `#F97316` | 2 |
| 11 | Recuperação D+7 | Recuperação | `#F97316` | 3 |
| 12 | Cliente | Desfecho | `#10B981` (verde) | - |
| 13 | Perdido | Desfecho | `#10B981` | - |

---

### Visualização no Kanban

```text
PRÉ-SESSÃO (azul)                    SESSÃO    DECISÃO (roxo)           RECUPERAÇÃO (laranja)        DESFECHO (verde)
┌──────────────────────────────────┐ ┌──────┐ ┌────────────────────────┐ ┌─────────────────────────┐ ┌──────────────────┐
│ Agendado│Confirm.│Remarc.│No-Show│ │Realiz│ │Fechou│Quente│Frio      │ │ D+2 │ D+4 │ D+7       │ │ Cliente│Perdido │
└──────────────────────────────────┘ └──────┘ └────────────────────────┘ └─────────────────────────┘ └──────────────────┘
      ▲ Colapsável                       │           ▲ Colapsável              ▲ Colapsável              ▲ Colapsável
```

---

### Ações a Executar

1. **Atualizar etapas existentes**
   - "Agendou" → renomear para "Agendado", adicionar grupo e cor
   - "Confirmou" → renomear para "Confirmado", adicionar grupo e cor

2. **Criar 11 novas etapas**
   - Remarcou, No-Show, Sessão Realizada, Fechou, Não Fechou (quente), Não Fechou (frio), Recuperação D+2/D+4/D+7, Cliente, Perdido

3. **Configurar fluxos especiais**
   - "No-Show" → `proxima_etapa_id` aponta para "Recuperação D+2"
   - "Não Fechou (quente)" → `proxima_etapa_id` aponta para "Recuperação D+2"
   - "Recuperação D+7" → `proxima_etapa_id` aponta para "Perdido" (timeout automático)

---

### SQL a Executar

```sql
-- Pipeline ID: f46a3fad-da4e-4f16-88f3-15b24f3b09b3

-- 1. Atualizar etapas existentes
UPDATE pipeline_stages 
SET nome = 'Agendado', 
    grupo = 'Pré-Sessão', 
    cor_grupo = '#3B82F6',
    prazo_em_dias = 3,
    updated_at = NOW()
WHERE id = '27b4ef65-5e2b-4c32-a601-a9291c72f963';

UPDATE pipeline_stages 
SET nome = 'Confirmado', 
    grupo = 'Pré-Sessão', 
    cor_grupo = '#3B82F6',
    prazo_em_dias = 2,
    updated_at = NOW()
WHERE id = '66215bb9-8e2a-4b4c-9312-00b7c788eef5';

-- 2. Inserir novas etapas
INSERT INTO pipeline_stages (pipeline_id, nome, ordem, prazo_em_dias, grupo, cor_grupo, proximo_passo_tipo, gerar_agendamento_auto, created_at, updated_at)
VALUES 
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Remarcou', 3, 3, 'Pré-Sessão', '#3B82F6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'No-Show', 4, 2, 'Pré-Sessão', '#3B82F6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Sessão Realizada', 5, 1, 'Sessão', '#8B5CF6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Fechou', 6, 1, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Não Fechou (quente)', 7, 2, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Não Fechou (frio)', 8, 7, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+2', 9, 2, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+4', 10, 2, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+7', 11, 3, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Cliente', 12, NULL, 'Desfecho', '#10B981', 'Outro', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Perdido', 13, NULL, 'Desfecho', '#10B981', 'Outro', false, NOW(), NOW());
```

---

### Resultado Esperado

Após a execução:
- Pipeline Comercial terá 13 etapas organizadas em 5 grupos visuais
- Cada grupo terá cor distinta na barra superior das colunas
- Grupos podem ser colapsados/expandidos no Kanban
- Etapas existentes ("Agendou"/"Confirmou") serão atualizadas sem perda de dados

---

### Seção Técnica

**Arquivos envolvidos**: Nenhum - apenas operações de banco de dados

**Considerações**:
- Os IDs das etapas existentes serão mantidos, preservando referências em `lead_pipeline_entries`
- Fluxos cíclicos (`proxima_etapa_id`) podem ser configurados manualmente após a criação das etapas
- O hook `useSupabasePipelineStages` já suporta os campos `grupo` e `cor_grupo`

