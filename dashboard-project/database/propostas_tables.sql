-- Tabela de propostas
CREATE TABLE IF NOT EXISTS propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    pedir_whatsapp BOOLEAN DEFAULT false,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('arquivo', 'canva')),
    link_canva TEXT,
    arquivo JSONB,
    status VARCHAR(50) DEFAULT 'Não aberta',
    visualizacoes INTEGER DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de aberturas de propostas (log)
CREATE TABLE IF NOT EXISTS aberturas_proposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
    nome_acesso VARCHAR(255) NOT NULL,
    wpp_acesso VARCHAR(20),
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip INET
);

-- A tabela propostaempresa NÃO é mais necessária pois usamos empresa_id diretamente
-- Estrutura antiga para referência (NÃO executar):
-- CREATE TABLE propostaempresa (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
--   id_empresas INTEGER REFERENCES empresas(id) ON DELETE CASCADE
-- );

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION incrementar_visualizacoes_proposta(proposta_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE propostas 
    SET visualizacoes = visualizacoes + 1,
        status = 'Aberta'
    WHERE id = proposta_id;
END;
$$ LANGUAGE plpgsql;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_propostas_usuario_id ON propostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_propostas_empresa_id ON propostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_propostas_data_criacao ON propostas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_tipo ON propostas(tipo);
-- CREATE INDEX IF NOT EXISTS idx_propostaempresa_proposta_id ON propostaempresa(proposta_id);
-- CREATE INDEX IF NOT EXISTS idx_propostaempresa_id_empresas ON propostaempresa(id_empresas);
CREATE INDEX IF NOT EXISTS idx_aberturas_proposta_proposta_id ON aberturas_proposta(proposta_id);
CREATE INDEX IF NOT EXISTS idx_aberturas_proposta_data_abertura ON aberturas_proposta(data_abertura);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_propostas_updated_at 
    BEFORE UPDATE ON propostas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE propostas IS 'Tabela para armazenar propostas comerciais';
COMMENT ON TABLE aberturas_proposta IS 'Log de aberturas/visualizações das propostas';
-- COMMENT ON TABLE propostaempresa IS 'Relação entre propostas e empresas (controle de acesso)';

COMMENT ON COLUMN propostas.nome IS 'Nome/título da proposta';
COMMENT ON COLUMN propostas.pedir_whatsapp IS 'Se deve solicitar WhatsApp do cliente';
COMMENT ON COLUMN propostas.tipo IS 'Tipo da proposta: arquivo ou canva';
COMMENT ON COLUMN propostas.link_canva IS 'URL do design no Canva (se tipo = canva)';
COMMENT ON COLUMN propostas.arquivo IS 'Metadados do arquivo (se tipo = arquivo)';
COMMENT ON COLUMN propostas.status IS 'Status da proposta: Não aberta, Aberta';
COMMENT ON COLUMN propostas.visualizacoes IS 'Contador de visualizações';
COMMENT ON COLUMN propostas.empresa_id IS 'ID da empresa proprietária da proposta';
-- COMMENT ON COLUMN propostaempresa.id_empresas IS 'ID da empresa com acesso à proposta';