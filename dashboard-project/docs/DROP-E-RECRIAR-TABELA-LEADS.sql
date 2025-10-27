-- ========================================
-- SCRIPT PARA RECRIAR TABELA LEADS
-- ========================================
-- Este script remove a tabela antiga e cria a nova estrutura

-- ⚠️ ATENÇÃO: Este script vai APAGAR todos os leads existentes!
-- Execute apenas se estiver certo de que quer começar do zero.

-- ========================================
-- PASSO 1: REMOVER ESTRUTURA ANTIGA
-- ========================================

-- Remover triggers
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

-- Remover função
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remover índices (serão recriados com a tabela)
DROP INDEX IF EXISTS idx_leads_email;
DROP INDEX IF EXISTS idx_leads_telefone;
DROP INDEX IF EXISTS idx_leads_stage;
DROP INDEX IF EXISTS idx_leads_data_entrada;
DROP INDEX IF EXISTS idx_leads_dados_originais_gin;
DROP INDEX IF EXISTS idx_leads_empresa_id;

-- Remover tabela
DROP TABLE IF EXISTS leads CASCADE;

-- ========================================
-- PASSO 2: CRIAR NOVA ESTRUTURA
-- ========================================

-- Criar tabela de leads com estrutura LIMPA
CREATE TABLE leads (
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
  dados_originais JSONB, -- Guarda os dados EXATOS que vieram da planilha + empresa_id
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- PASSO 3: CRIAR ÍNDICES
-- ========================================

-- Busca por email
CREATE INDEX idx_leads_email ON leads(email);

-- Busca por telefone
CREATE INDEX idx_leads_telefone ON leads(telefone);

-- Filtro por stage (pipeline)
CREATE INDEX idx_leads_stage ON leads(stage);

-- Filtro por data de entrada
CREATE INDEX idx_leads_data_entrada ON leads(data_entrada DESC);

-- ⭐ ÍNDICES JSONB ⭐
CREATE INDEX idx_leads_dados_originais_gin ON leads USING GIN (dados_originais);

-- ⭐ ÍNDICE PARA EMPRESA_ID (PERMISSIONAMENTO) ⭐
CREATE INDEX idx_leads_empresa_id ON leads ((dados_originais->>'empresa_id'));

-- ========================================
-- PASSO 4: CRIAR FUNÇÃO E TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PASSO 5: COMENTÁRIOS
-- ========================================

COMMENT ON TABLE leads IS 'Tabela de leads do CRM - Nova estrutura com JSONB';
COMMENT ON COLUMN leads.id IS 'ID único do lead';
COMMENT ON COLUMN leads.nome IS 'Nome completo do lead';
COMMENT ON COLUMN leads.email IS 'Email de contato';
COMMENT ON COLUMN leads.telefone IS 'Telefone/WhatsApp';
COMMENT ON COLUMN leads.data_contato IS 'Data do primeiro contato';
COMMENT ON COLUMN leads.stage IS 'Etapa do pipeline: entrou, agendou, analisando, fechou';
COMMENT ON COLUMN leads.data_entrada IS 'Data e hora que o lead entrou no sistema';
COMMENT ON COLUMN leads.dados_originais IS 'JSON com os dados exatos recebidos. OBRIGATÓRIO: empresa_id';

-- ========================================
-- PASSO 6: DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Inserir leads de exemplo
INSERT INTO leads (nome, email, telefone, data_contato, stage, dados_originais) VALUES
  ('João Silva', 'joao@exemplo.com', '41999887766', NOW()::TEXT, 'entrou', 
   '{"empresa_id": "1", "origem": "Google Sheets", "interesse": "Produto X"}'::JSONB),
  ('Maria Santos', 'maria@exemplo.com', '41988776655', NOW()::TEXT, 'agendou', 
   '{"empresa_id": "1", "origem": "Site", "observacao": "Cliente interessado"}'::JSONB),
  ('Pedro Oliveira', 'pedro@exemplo.com', '41977665544', NOW()::TEXT, 'analisando', 
   '{"empresa_id": "2", "origem": "Facebook Ads", "valor": "5000"}'::JSONB);

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Ver estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Ver leads criados
SELECT id, nome, email, telefone, stage, dados_originais 
FROM leads 
ORDER BY id;

-- Ver índices criados
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'leads';

-- ========================================
-- SUCESSO!
-- ========================================

SELECT '✅ Tabela leads recriada com sucesso!' as status;
SELECT '✅ ' || COUNT(*) || ' leads de exemplo inseridos' as leads_exemplo 
FROM leads;
