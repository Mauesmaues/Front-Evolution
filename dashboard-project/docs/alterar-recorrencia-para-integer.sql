-- Script para alterar o tipo da coluna 'recorrencia' para INTEGER
-- Execute este script se a tabela já existir e precisar atualizar o tipo da coluna

-- Caso a tabela já exista com recorrencia como VARCHAR, precisamos alterar

-- Passo 1: Adicionar uma coluna temporária
ALTER TABLE public.controle_saldo_inputs_manuais 
ADD COLUMN IF NOT EXISTS recorrencia_temp INTEGER;

-- Passo 2: Migrar dados existentes tentando converter strings para números
-- Exemplos de conversão:
-- "Mensal" -> 30
-- "Semanal" -> 7
-- "Quinzenal" -> 15
-- "Diário" -> 1
-- "30" (string) -> 30 (integer)

UPDATE public.controle_saldo_inputs_manuais
SET recorrencia_temp = 
    CASE 
        WHEN LOWER(recorrencia) LIKE '%mensal%' OR LOWER(recorrencia) LIKE '%mês%' OR LOWER(recorrencia) LIKE '%mes%' THEN 30
        WHEN LOWER(recorrencia) LIKE '%quinzenal%' OR recorrencia LIKE '%15%' THEN 15
        WHEN LOWER(recorrencia) LIKE '%semanal%' OR LOWER(recorrencia) LIKE '%semana%' THEN 7
        WHEN LOWER(recorrencia) LIKE '%diario%' OR LOWER(recorrencia) LIKE '%diária%' OR LOWER(recorrencia) LIKE '%dia%' THEN 1
        WHEN LOWER(recorrencia) LIKE '%bimestral%' THEN 60
        WHEN LOWER(recorrencia) LIKE '%trimestral%' THEN 90
        WHEN LOWER(recorrencia) LIKE '%semestral%' THEN 180
        WHEN LOWER(recorrencia) LIKE '%anual%' OR LOWER(recorrencia) LIKE '%ano%' THEN 365
        -- Tentar converter diretamente se for um número
        WHEN recorrencia ~ '^\d+$' THEN recorrencia::INTEGER
        ELSE NULL
    END
WHERE recorrencia IS NOT NULL;

-- Passo 3: Remover a coluna antiga
ALTER TABLE public.controle_saldo_inputs_manuais 
DROP COLUMN IF EXISTS recorrencia;

-- Passo 4: Renomear a coluna temporária
ALTER TABLE public.controle_saldo_inputs_manuais 
RENAME COLUMN recorrencia_temp TO recorrencia;

-- Passo 5: Atualizar o comentário
COMMENT ON COLUMN public.controle_saldo_inputs_manuais.recorrencia IS 'Periodicidade da recarga em dias (ex: 30 para mensal, 7 para semanal)';

-- Verificar resultado
SELECT id, id_empresa, ultima_recarga, saldo_diario, recorrencia 
FROM public.controle_saldo_inputs_manuais;
