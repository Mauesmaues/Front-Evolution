-- =============================================
-- FIX: Remover Constraint de Stage para Stages Dinâmicos
-- =============================================
-- Problema: A tabela leads tem uma constraint que valida
-- apenas valores hardcoded: 'entrou', 'agendou', 'analisando', 'fechou'
-- 
-- Com stages dinâmicos, qualquer valor de stage deve ser permitido
-- =============================================

-- 1. Verificar constraint existente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
    AND contype = 'c'
    AND conname LIKE '%stage%';

-- 2. Remover a constraint de check do campo stage
-- (O nome pode variar, ajuste se necessário)
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_stage_check;

-- Alternativa: Se o nome for diferente, tente este padrão:
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS check_stage;

ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS stage_check;

-- 3. Verificar se a constraint foi removida
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
    AND contype = 'c';

-- 4. (OPCIONAL) Se você quiser validar que stage não é vazio/null:
-- ALTER TABLE leads 
-- ADD CONSTRAINT leads_stage_not_empty 
-- CHECK (stage IS NOT NULL AND stage <> '');

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Testar update com novo stage personalizado
-- UPDATE leads 
-- SET stage = 'qualificado' 
-- WHERE id = 702;

-- Se funcionar sem erro, a constraint foi removida com sucesso!

-- =============================================
-- NOTA IMPORTANTE
-- =============================================
-- Após executar este script:
-- 1. Qualquer valor de stage será aceito
-- 2. A validação de stages válidos deve ser feita no backend
-- 3. O StageController já faz essa validação
-- 4. Leads antigos com stages hardcoded continuarão funcionando
-- =============================================
