-- Add display_config column to pipelines table
ALTER TABLE pipelines 
ADD COLUMN display_config JSONB DEFAULT '{
  "card_fields": ["nome", "origem", "tags", "responsavel", "sla"],
  "table_columns": ["nome", "contato", "etapa", "dias", "sla", "saude", "score", "responsavel", "tags"],
  "show_deals": false,
  "show_orders": false,
  "show_appointments": true
}'::jsonb;

-- Add valor_recorrente column to deals table for recurring sales
ALTER TABLE deals ADD COLUMN valor_recorrente NUMERIC DEFAULT NULL;

-- Set specific configuration for comercial pipeline
UPDATE pipelines SET display_config = '{
  "card_fields": ["nome", "origem", "valor_deal", "closer", "sla"],
  "table_columns": ["nome", "contato", "etapa", "origem", "valor_deal", "valor_recorrente", "data_sessao", "closer", "objecao"],
  "show_deals": true,
  "show_orders": true,
  "show_appointments": true
}'::jsonb WHERE slug = 'comercial';