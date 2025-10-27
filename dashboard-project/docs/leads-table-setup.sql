-- ========================================
-- TABELA DE LEADS PARA CRM - ESTRUTURA FLEXÍVEL
-- ========================================

-- Criar tabela de leads (se não existir)
-- Esta tabela suporta campos dinâmicos através de JSONB
CREATE TABLE IF NOT EXISTS leads (
  -- Identificação
  id SERIAL PRIMARY KEY,
  
  -- Dados principais do lead (campos mais comuns - otimizados para busca)
  nome TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Dados comerciais
  data_contato TEXT,
  
  -- Controle de pipeline
  stage TEXT DEFAULT 'entrou' CHECK (stage IN ('entrou', 'agendou', 'analisando', 'fechou')),
  
  -- Metadados
  data_entrada TIMESTAMP DEFAULT NOW(),
  
  -- ⭐ CAMPO DINÂMICO (JSONB) - AQUI A MÁGICA ACONTECE ⭐
  -- Permite guardar QUALQUER estrutura de dados sem alterar a tabela
  -- Incluindo: empresa_id (para permissionamento), origem, observação, etc.
  dados_originais JSONB, -- Guarda os dados EXATOS que vieram da planilha + empresa_id
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Busca por email
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Busca por telefone
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);

-- Filtro por stage (pipeline)
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);

-- Filtro por data de entrada
CREATE INDEX IF NOT EXISTS idx_leads_data_entrada ON leads(data_entrada DESC);

-- ⭐ ÍNDICES JSONB - Permite buscar dentro dos campos dinâmicos ⭐
-- GIN index para busca eficiente em campos JSONB
CREATE INDEX IF NOT EXISTS idx_leads_dados_originais_gin ON leads USING GIN (dados_originais);

-- ⭐ ÍNDICE PARA EMPRESA_ID (PERMISSIONAMENTO) ⭐
-- Permite filtrar leads por empresa de forma eficiente
CREATE INDEX IF NOT EXISTS idx_leads_empresa_id ON leads ((dados_originais->>'empresa_id'));

-- Exemplos de busca JSONB que esses índices otimizam:
-- SELECT * FROM leads WHERE dados_originais->>'empresa_id' = '1';
-- SELECT * FROM leads WHERE dados_originais @> '{"Campanha": "Facebook"}';
-- SELECT * FROM leads WHERE dados_originais ? 'interesse';
-- SELECT * FROM leads WHERE dados_originais->>'status' = 'novo';

-- ========================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o campo updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMENTÁRIOS DA TABELA
-- ========================================

COMMENT ON TABLE leads IS 'Tabela de leads do CRM - Recebe dados de Google Sheets, formulários e outras fontes';
COMMENT ON COLUMN leads.id IS 'ID único do lead';
COMMENT ON COLUMN leads.nome IS 'Nome completo do lead';
COMMENT ON COLUMN leads.email IS 'Email de contato';
COMMENT ON COLUMN leads.telefone IS 'Telefone/WhatsApp';
COMMENT ON COLUMN leads.data_contato IS 'Data do primeiro contato';
COMMENT ON COLUMN leads.stage IS 'Etapa do pipeline: entrou, agendou, analisando, fechou';
COMMENT ON COLUMN leads.data_entrada IS 'Data e hora que o lead entrou no sistema';
COMMENT ON COLUMN leads.dados_originais IS 'JSON com os dados exatos recebidos da fonte original. OBRIGATÓRIO: empresa_id para permissionamento';

-- ========================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Inserir alguns leads de exemplo para teste
-- IMPORTANTE: Substitua '1' pelo ID real da empresa no seu sistema
INSERT INTO leads (nome, email, telefone, data_contato, stage, dados_originais) VALUES
  ('João Silva', 'joao@exemplo.com', '41999887766', NOW()::TEXT, 'entrou', 
   '{"empresa_id": "1", "empresa": "Empresa ABC", "origem": "Google Sheets", "interesse": "Produto X"}'::JSONB),
  ('Maria Santos', 'maria@exemplo.com', '41988776655', NOW()::TEXT, 'agendou', 
   '{"empresa_id": "1", "empresa": "Empresa ABC", "origem": "Site", "observacao": "Cliente interessado em consultoria"}'::JSONB),
  ('Pedro Oliveira', 'pedro@exemplo.com', '41977665544', NOW()::TEXT, 'analisando', 
   '{"empresa_id": "2", "empresa": "Empresa XYZ", "origem": "Facebook Ads", "valor": "5000", "campanha": "Verão 2025"}'::JSONB)
ON CONFLICT DO NOTHING;

-- ========================================
-- CONSULTAS ÚTEIS
-- ========================================

-- Ver todos os leads
-- SELECT * FROM leads ORDER BY data_entrada DESC;

-- Ver leads por stage
-- SELECT stage, COUNT(*) as total FROM leads GROUP BY stage;

-- Ver últimos 10 leads
-- SELECT id, nome, email, telefone, stage, data_entrada 
-- FROM leads 
-- ORDER BY data_entrada DESC 
-- LIMIT 10;

-- Buscar lead por email
-- SELECT * FROM leads WHERE email = 'joao@exemplo.com';

-- ========================================
-- CONSULTAS COM PERMISSIONAMENTO (SEGUINDO PADRÃO DO SISTEMA)
-- ========================================

-- 🔐 PERMISSIONAMENTO POR TIPO DE USUÁRIO:
-- - ADMIN/GESTOR: Vê TODOS os leads
-- - USER: Vê apenas leads das empresas que tem acesso

-- 1️⃣ Consulta para ADMIN/GESTOR (vê todos os leads)
-- SELECT * FROM leads ORDER BY data_entrada DESC;

-- 2️⃣ Consulta para USER (filtrar por empresas específicas)
-- Exemplo: Usuário tem acesso às empresas com IDs 1, 2 e 3
-- SELECT * FROM leads 
-- WHERE dados_originais->>'empresa_id' IN ('1', '2', '3')
-- ORDER BY data_entrada DESC;

-- 3️⃣ Consulta dinâmica baseada na permissão do usuário
-- Use esta query no backend substituindo os valores:
-- - $1 = permissão do usuário ('ADMIN', 'GESTOR', 'USER')
-- - $2 = array de empresa_ids do usuário (ex: ['1', '2', '3'])
/*
SELECT l.* 
FROM leads l
WHERE 
  CASE 
    -- ADMIN e GESTOR veem tudo
    WHEN $1 IN ('ADMIN', 'GESTOR') THEN TRUE
    -- USER vê apenas suas empresas
    WHEN $1 = 'USER' THEN dados_originais->>'empresa_id' = ANY($2)
    ELSE FALSE
  END
ORDER BY data_entrada DESC;
*/

-- 4️⃣ Ver leads de uma empresa específica (caso comum)
-- SELECT * FROM leads 
-- WHERE dados_originais->>'empresa_id' = '1'
-- ORDER BY data_entrada DESC;

-- 5️⃣ Contar leads por empresa (visão gerencial para ADMIN)
-- SELECT 
--   dados_originais->>'empresa_id' as empresa_id,
--   dados_originais->>'empresa' as empresa_nome,
--   COUNT(*) as total_leads
-- FROM leads 
-- WHERE dados_originais->>'empresa_id' IS NOT NULL
-- GROUP BY dados_originais->>'empresa_id', dados_originais->>'empresa'
-- ORDER BY total_leads DESC;

-- 6️⃣ Ver leads por stage e empresa (para USER)
-- SELECT 
--   stage,
--   COUNT(*) as total
-- FROM leads 
-- WHERE dados_originais->>'empresa_id' IN ('1', '2')
-- GROUP BY stage
-- ORDER BY stage;

-- 7️⃣ Leads do último mês por empresa (para relatórios)
-- SELECT 
--   dados_originais->>'empresa_id' as empresa_id,
--   COUNT(*) as leads_mes
-- FROM leads 
-- WHERE 
--   dados_originais->>'empresa_id' IN ('1', '2', '3')
--   AND data_entrada >= NOW() - INTERVAL '30 days'
-- GROUP BY dados_originais->>'empresa_id';

-- 8️⃣ Verificar se usuário tem acesso a um lead específico
-- (útil antes de editar/deletar)
/*
SELECT EXISTS (
  SELECT 1 FROM leads 
  WHERE id = 123 
  AND (
    -- ADMIN/GESTOR sempre tem acesso
    '{{permissao_usuario}}' IN ('ADMIN', 'GESTOR')
    OR
    -- USER só se o lead for da sua empresa
    dados_originais->>'empresa_id' IN ('1', '2', '3')
  )
) as tem_acesso;
*/

-- ========================================
-- CONSULTAS JSONB AVANÇADAS
-- ========================================

-- 1️⃣ Buscar leads que têm um campo específico nos dados originais
-- SELECT * FROM leads WHERE dados_originais ? 'Campanha';

-- 2️⃣ Buscar leads com valor específico em campo dinâmico
-- SELECT * FROM leads WHERE dados_originais->>'Campanha' = 'Facebook';

-- 3️⃣ Buscar leads que contêm um objeto específico (match exato)
-- SELECT * FROM leads WHERE dados_originais @> '{"status": "novo", "interesse": "produto-x"}';

-- 4️⃣ Listar todos os leads mostrando um campo dinâmico específico
-- SELECT id, nome, email, dados_originais->>'Campanha' as campanha 
-- FROM leads 
-- WHERE dados_originais ? 'Campanha';

-- 5️⃣ Contar leads por valor de campo dinâmico
-- SELECT dados_originais->>'Campanha' as campanha, COUNT(*) 
-- FROM leads 
-- WHERE dados_originais ? 'Campanha'
-- GROUP BY dados_originais->>'Campanha';

-- 6️⃣ Buscar leads onde campo dinâmico existe e não é nulo
-- SELECT * FROM leads 
-- WHERE dados_originais->>'interesse' IS NOT NULL;

-- 7️⃣ Ver a estrutura completa dos dados originais de um lead
-- SELECT id, nome, jsonb_pretty(dados_originais) as dados
-- FROM leads 
-- WHERE id = 1;

-- 8️⃣ Listar TODOS os campos únicos que existem em dados_originais
-- SELECT DISTINCT jsonb_object_keys(dados_originais) as campo
-- FROM leads
-- ORDER BY campo;

-- 9️⃣ Buscar leads com valor numérico em campo dinâmico
-- SELECT * FROM leads 
-- WHERE (dados_originais->>'orcamento')::numeric > 5000;

-- 🔟 Buscar leads com array em campo dinâmico
-- SELECT * FROM leads 
-- WHERE dados_originais->'produtos' @> '["produto-a"]';

-- ========================================
-- EXEMPLOS DE ATUALIZAÇÃO JSONB
-- ========================================

-- Adicionar novo campo aos dados originais
-- UPDATE leads 
-- SET dados_originais = jsonb_set(dados_originais, '{novo_campo}', '"valor"')
-- WHERE id = 1;

-- Remover campo dos dados originais
-- UPDATE leads 
-- SET dados_originais = dados_originais - 'campo_para_remover'
-- WHERE id = 1;

-- Atualizar valor de campo existente
-- UPDATE leads 
-- SET dados_originais = jsonb_set(dados_originais, '{campo_existente}', '"novo_valor"')
-- WHERE id = 1;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
