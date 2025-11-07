-- Script SQL para criar a tabela de campos manuais para empresas
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.controle_saldo_inputs_manuais (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ultima_recarga DATE,
    saldo_diario DECIMAL(10, 2),
    recorrencia INTEGER, -- Alterado para INTEGER (dias)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_empresa)
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_controle_saldo_id_empresa 
ON public.controle_saldo_inputs_manuais(id_empresa);

-- Comentários para documentação
COMMENT ON TABLE public.controle_saldo_inputs_manuais IS 'Armazena dados manuais de controle de saldo para empresas';
COMMENT ON COLUMN public.controle_saldo_inputs_manuais.id_empresa IS 'Referência à empresa';
COMMENT ON COLUMN public.controle_saldo_inputs_manuais.ultima_recarga IS 'Data da última recarga de saldo';
COMMENT ON COLUMN public.controle_saldo_inputs_manuais.saldo_diario IS 'Valor do saldo diário';
COMMENT ON COLUMN public.controle_saldo_inputs_manuais.recorrencia IS 'Periodicidade da recarga em dias (ex: 30 para mensal, 7 para semanal)';

-- Habilitar RLS (Row Level Security) para segurança
ALTER TABLE public.controle_saldo_inputs_manuais ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (ajuste conforme suas necessidades de segurança)
CREATE POLICY "Permitir acesso completo para usuários autenticados" 
ON public.controle_saldo_inputs_manuais
FOR ALL 
USING (true)
WITH CHECK (true);
