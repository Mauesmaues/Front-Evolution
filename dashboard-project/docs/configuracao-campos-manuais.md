# Configuração dos Campos Manuais para Empresas

## Problema Identificado
A tabela `controle_saldo_inputs_manuais` não existe no banco de dados Supabase, causando erro 500 ao tentar buscar empresas.

## Solução

### Passo 1: Criar a Tabela no Supabase

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral esquerdo)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `docs/criar-tabela-campos-manuais.sql`
6. Clique em **Run** para executar o script

O script vai criar:
- A tabela `controle_saldo_inputs_manuais` com os campos:
  - `id` (chave primária)
  - `id_empresa` (referência à tabela empresas)
  - `ultima_recarga` (data da última recarga)
  - `saldo_diario` (valor do saldo diário)
  - `recorrencia` (periodicidade da recarga)
  - `created_at` e `updated_at` (timestamps)
- Índice para melhorar a performance
- Políticas de segurança (RLS)

### Passo 2: Reiniciar o Servidor Backend

Depois de criar a tabela, reinicie o servidor backend:

```bash
# Parar o servidor atual (Ctrl+C no terminal)
# Depois executar:
cd dashboard-project/backend
node server.js
```

### Passo 3: Testar a Funcionalidade

1. Acesse o painel de Administração
2. Vá para a aba "Empresas"
3. A tabela deve exibir as empresas com as novas colunas:
   - Última Recarga
   - Saldo Diário
   - Recorrência
4. Clique no botão "Editar Manuais" para editar esses campos
5. Preencha os dados e clique em "Salvar"

## Mudanças Implementadas

### Backend
- ✅ Modificado `EmpresaController.js`:
  - Busca dados da tabela `controle_saldo_inputs_manuais`
  - Trata erro caso a tabela não exista (não quebra a aplicação)
  - Mescla os dados manuais com os dados das empresas
  - Adicionado método `salvarCamposManuais` para salvar/atualizar campos

- ✅ Adicionada rota em `routes/api.js`:
  - `POST /api/empresa/manuais` - Para salvar/atualizar campos manuais

### Frontend
- ✅ Modificado `logicaPaineis.js`:
  - Tabela exibe as novas colunas
  - Modal para editar campos manuais
  - Integração com a API para salvar os dados
  - Logs detalhados para depuração

## Estrutura da Tabela

```sql
controle_saldo_inputs_manuais
├── id (PRIMARY KEY)
├── id_empresa (FOREIGN KEY → empresas.id)
├── ultima_recarga (DATE)
├── saldo_diario (DECIMAL)
├── recorrencia (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Notas Importantes

- A tabela tem uma constraint `UNIQUE` no campo `id_empresa`, garantindo apenas um registro por empresa
- Quando uma empresa é excluída, os dados manuais também são excluídos automaticamente (CASCADE)
- Se a tabela não existir, o sistema continua funcionando normalmente, apenas sem os campos manuais
- Os logs detalhados no console ajudam a identificar problemas
