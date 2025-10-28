-- =============================================
-- TABELA DE STAGES (ETAPAS) PERSONALIZÁVEIS
-- Permite cada empresa configurar suas próprias
-- etapas do funil CRM com cores customizadas
-- =============================================

-- Criar tabela empresa_stages
CREATE TABLE IF NOT EXISTS empresa_stages (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL,
    estagios JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: empresa deve existir
    CONSTRAINT fk_empresa
        FOREIGN KEY (id_empresa) 
        REFERENCES empresas(id) 
        ON DELETE CASCADE,
    
    -- Constraint: apenas um registro por empresa
    CONSTRAINT unique_empresa_stages 
        UNIQUE (id_empresa)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresa_stages_empresa 
    ON empresa_stages(id_empresa);

-- Comentários da tabela
COMMENT ON TABLE empresa_stages IS 'Armazena configurações personalizadas de etapas (stages) do CRM por empresa';
COMMENT ON COLUMN empresa_stages.id IS 'ID único do registro';
COMMENT ON COLUMN empresa_stages.id_empresa IS 'ID da empresa dona das configurações';
COMMENT ON COLUMN empresa_stages.estagios IS 'Array JSON com as etapas configuradas. Formato: [{"id": "string", "nome": "string", "cor": "#hex", "ordem": number}]';
COMMENT ON COLUMN empresa_stages.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN empresa_stages.updated_at IS 'Data da última atualização';

-- =============================================
-- EXEMPLOS DE USO
-- =============================================

-- Exemplo 1: Inserir stages personalizados para empresa 1
INSERT INTO empresa_stages (id_empresa, estagios)
VALUES (
    1,
    '[
        {"id": "lead_novo", "nome": "Lead Novo", "cor": "#2196F3", "ordem": 1},
        {"id": "contato_inicial", "nome": "Contato Inicial", "cor": "#FF9800", "ordem": 2},
        {"id": "proposta_enviada", "nome": "Proposta Enviada", "cor": "#9C27B0", "ordem": 3},
        {"id": "negociacao", "nome": "Negociação", "cor": "#FFC107", "ordem": 4},
        {"id": "fechado", "nome": "Fechado", "cor": "#4CAF50", "ordem": 5}
    ]'::jsonb
);

-- Exemplo 2: Atualizar stages existentes
UPDATE empresa_stages
SET 
    estagios = '[
        {"id": "novo", "nome": "Novo", "cor": "#2196F3", "ordem": 1},
        {"id": "qualificado", "nome": "Qualificado", "cor": "#FF9800", "ordem": 2},
        {"id": "convertido", "nome": "Convertido", "cor": "#4CAF50", "ordem": 3}
    ]'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE id_empresa = 1;

-- Exemplo 3: Buscar stages de uma empresa
SELECT 
    id,
    id_empresa,
    estagios,
    created_at,
    updated_at
FROM empresa_stages
WHERE id_empresa = 1;

-- Exemplo 4: Buscar stages com formatação JSON
SELECT 
    id_empresa,
    jsonb_array_elements(estagios) as stage
FROM empresa_stages
WHERE id_empresa = 1;

-- Exemplo 5: Contar quantas etapas cada empresa tem
SELECT 
    id_empresa,
    jsonb_array_length(estagios) as total_stages
FROM empresa_stages;

-- Exemplo 6: Deletar stages de uma empresa (volta para padrão)
DELETE FROM empresa_stages
WHERE id_empresa = 1;

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_empresa_stages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_empresa_stages_timestamp
    BEFORE UPDATE ON empresa_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_empresa_stages_timestamp();

-- =============================================
-- VALIDAÇÃO: Verificar se estrutura está correta
-- =============================================

-- Listar todas as tabelas relacionadas ao CRM
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('empresas', 'empresa_stages', 'leads', 'usuarios');

-- Verificar constraints da tabela
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'empresa_stages'::regclass;

-- Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'empresa_stages';

-- =============================================
-- DADOS DE TESTE
-- =============================================

-- Inserir stages de teste para empresas de exemplo
INSERT INTO empresa_stages (id_empresa, estagios)
VALUES 
    (1, '[
        {"id": "entrou", "nome": "Entrou", "cor": "#2196F3", "ordem": 1},
        {"id": "qualificado", "nome": "Qualificado", "cor": "#FF9800", "ordem": 2},
        {"id": "conversao", "nome": "Conversão", "cor": "#9C27B0", "ordem": 3},
        {"id": "ganho", "nome": "Ganho", "cor": "#4CAF50", "ordem": 4}
    ]'::jsonb),
    (2, '[
        {"id": "prospeccao", "nome": "Prospecção", "cor": "#00BCD4", "ordem": 1},
        {"id": "reuniao", "nome": "Reunião Agendada", "cor": "#FF5722", "ordem": 2},
        {"id": "proposta", "nome": "Proposta", "cor": "#673AB7", "ordem": 3},
        {"id": "fechamento", "nome": "Fechamento", "cor": "#8BC34A", "ordem": 4},
        {"id": "pos_venda", "nome": "Pós-Venda", "cor": "#607D8B", "ordem": 5}
    ]'::jsonb)
ON CONFLICT (id_empresa) DO NOTHING;
