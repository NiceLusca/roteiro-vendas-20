-- Adicionar campo boolean para indicar se é venda recorrente
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;

-- Migrar dados existentes (se valor_recorrente > 0, marcar como recorrente)
UPDATE deals 
SET recorrente = true 
WHERE valor_recorrente IS NOT NULL AND valor_recorrente > 0;