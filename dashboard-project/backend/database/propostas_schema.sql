-- Tabela de propostas
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  pedirWhatsapp BOOLEAN DEFAULT FALSE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('arquivo', 'canva')),
  linkCanva TEXT,
  arquivo JSONB, -- Para armazenar metadados do arquivo
  dataCriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'Não aberta' CHECK (status IN ('Não aberta', 'Aberta')),
  visualizacoes INTEGER DEFAULT 0,
  usuarioId INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação propostas-empresas (já existe)
-- CREATE TABLE propostaempresa (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
--   id_empresas INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Tabela opcional para log de aberturas (para histórico detalhado)
CREATE TABLE IF NOT EXISTS abertura_propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  dataHora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip INET,
  userAgent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_propostas_usuario ON propostas(usuarioId);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_data ON propostas(dataCriacao);
CREATE INDEX IF NOT EXISTS idx_propostaempresa_proposta ON propostaempresa(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostaempresa_empresa ON propostaempresa(id_empresas);
CREATE INDEX IF NOT EXISTS idx_abertura_propostas_proposta ON abertura_propostas(proposta_id);

-- RLS (Row Level Security) - seguindo o padrão do projeto
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostaempresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE abertura_propostas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para propostas
CREATE POLICY "Usuários podem ver suas próprias propostas ou propostas de suas empresas" 
ON propostas FOR ALL 
USING (
  -- ADMIN e GESTOR veem todas
  auth.jwt() ->> 'role' IN ('ADMIN', 'GESTOR') OR
  -- USER vê apenas propostas vinculadas às suas empresas
  (
    auth.jwt() ->> 'role' = 'USER' AND 
    id IN (
      SELECT pe.proposta_id 
      FROM propostaempresa pe
      INNER JOIN usuario_empresa ue ON pe.id_empresas = ue.empresa_id
      WHERE ue.usuario_id = (auth.jwt() ->> 'user_id')::integer
    )
  ) OR
  -- Ou propostas criadas pelo próprio usuário
  usuarioId = (auth.jwt() ->> 'user_id')::integer
);

-- Políticas para propostaempresa
CREATE POLICY "Gerenciar relações proposta-empresa baseado em permissões" 
ON propostaempresa FOR ALL 
USING (
  -- ADMIN e GESTOR podem tudo
  auth.jwt() ->> 'role' IN ('ADMIN', 'GESTOR') OR
  -- USER pode apenas vincular às suas empresas
  (
    auth.jwt() ->> 'role' = 'USER' AND 
    id_empresas IN (
      SELECT empresa_id 
      FROM usuario_empresa 
      WHERE usuario_id = (auth.jwt() ->> 'user_id')::integer
    )
  )
);

-- Políticas para abertura_propostas
CREATE POLICY "Logs de abertura visíveis baseado em permissões da proposta" 
ON abertura_propostas FOR ALL 
USING (
  proposta_id IN (
    SELECT id FROM propostas 
    -- Reutiliza a lógica de permissão das propostas
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_propostas_updated_at 
BEFORE UPDATE ON propostas 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();