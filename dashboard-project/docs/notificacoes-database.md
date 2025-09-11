# Estrutura do Banco de Dados - Notificações

## Tabelas necessárias para o sistema de notificações

### 1. Tabela: notificacoes
```sql
CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    numero_destinatario VARCHAR(20) NOT NULL,
    horario TIME NOT NULL DEFAULT '09:00:00',
    ativo BOOLEAN NOT NULL DEFAULT true,
);
```

### 2. Tabela: notificacao_empresas (relacionamento N:N)
```sql
CREATE TABLE notificacao_empresas (
    id SERIAL PRIMARY KEY,
    notificacao_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    FOREIGN KEY (notificacao_id) REFERENCES notificacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE(notificacao_id, empresa_id)
);
```

### 3. Índices para performance
```sql
-- Índice para buscar notificações por usuário
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);

-- Índice para buscar notificações ativas
CREATE INDEX idx_notificacoes_ativo ON notificacoes(ativo);

-- Índice para buscar por horário (útil para agendamentos)
CREATE INDEX idx_notificacoes_horario ON notificacoes(horario);

-- Índice composto para a tabela de relacionamentos
CREATE INDEX idx_notificacao_empresas_notificacao_id ON notificacao_empresas(notificacao_id);
CREATE INDEX idx_notificacao_empresas_empresa_id ON notificacao_empresas(empresa_id);
```

### 4. Trigger para atualizar updated_at automaticamente
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notificacoes_updated_at 
    BEFORE UPDATE ON notificacoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Execução

Execute os comandos SQL acima no seu banco PostgreSQL/Supabase na ordem apresentada.

## Estrutura do Sistema

O sistema de notificações permite:

1. **Cadastro de Notificações Diárias**
   - Nome da notificação
   - Número do destinatário (WhatsApp)
   - Horário de envio
   - Status ativo/inativo
   - Associação com múltiplas empresas

2. **Gestão de Notificações**
   - Listagem de notificações cadastradas
   - Edição de notificações (placeholder)
   - Exclusão de notificações
   - Filtros por status

3. **Interface Responsiva**
   - Sistema de abas
   - Checkboxes com "Selecionar Todas"
   - Validação de formulários
   - Mensagens de feedback
   - Design consistente com o restante da aplicação

## Próximos Passos

Para implementar o envio automático das notificações, será necessário:

1. Criar um serviço de agendamento (cron job)
2. Integrar com API do WhatsApp Business
3. Implementar logs de envio
4. Adicionar funcionalidade de edição de notificações