# 🔄 CRM - Nova Estrutura com Permissionamento por Empresa

## 📋 Resumo das Mudanças

O sistema CRM foi reestruturado para trabalhar com uma tabela simplificada que armazena apenas campos essenciais e utiliza JSONB para dados dinâmicos. **Todas as operações agora são permissionadas por empresa.**

---

## 🗄️ Nova Estrutura da Tabela `leads`

### Campos da Tabela

```sql
CREATE TABLE IF NOT EXISTS leads (
  -- Identificação
  id SERIAL PRIMARY KEY,
  
  -- Dados principais (otimizados para busca)
  nome TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Dados comerciais
  data_contato TEXT,
  
  -- Controle de pipeline
  stage TEXT DEFAULT 'entrou' CHECK (stage IN ('entrou', 'agendou', 'analisando', 'fechou')),
  
  -- Metadados
  data_entrada TIMESTAMP DEFAULT NOW(),
  
  -- ⭐ CAMPO DINÂMICO (JSONB) ⭐
  -- Guarda TODOS os dados extras, incluindo empresa_id para permissionamento
  dados_originais JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ✅ O que mudou?

| Campo Removido | Onde está agora |
|---------------|-----------------|
| `empresa` | `dados_originais->>'empresa'` |
| `origem` | `dados_originais->>'origem'` |
| `valor` | `dados_originais->>'valor'` |
| `observacao` | `dados_originais->>'observacao'` |
| `campos_extras` | Tudo vai para `dados_originais` |

### 🔑 Campo Obrigatório: `empresa_id`

**IMPORTANTE:** Todo lead DEVE ter `empresa_id` no campo `dados_originais` para funcionar o permissionamento.

```json
{
  "empresa_id": "1",
  "empresa": "Empresa ABC",
  "origem": "Google Sheets",
  "campanha": "Verão 2025",
  "interesse": "Produto X"
}
```

---

## 🔐 Sistema de Permissionamento

### Como Funciona

1. **ADMIN e GESTOR:** Veem **TODOS** os leads de **TODAS** as empresas
2. **USER:** Vê apenas leads das **empresas vinculadas** a ele

### Implementação no Backend

```javascript
// Exemplo: Listar leads com permissionamento
if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
  // Buscar todos
  leads = await supabase.from('leads').select('*');
} else if (usuario.permissao === 'USER') {
  // Buscar empresas do usuário
  const empresasUsuario = await supabase
    .from('usuario_empresa')
    .select('empresa_id')
    .eq('usuario_id', usuario.id);
  
  const empresasIds = empresasUsuario.map(e => e.empresa_id.toString());
  
  // Filtrar leads por empresa_id no JSONB
  const todosLeads = await supabase.from('leads').select('*');
  leads = todosLeads.filter(lead => 
    empresasIds.includes(lead.dados_originais?.empresa_id?.toString())
  );
}
```

### Índice para Performance

```sql
-- Índice no campo empresa_id dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_leads_empresa_id 
ON leads ((dados_originais->>'empresa_id'));
```

---

## 📡 Rotas da API

### 1. **POST /api/leads** - Receber Lead Externo (Google Sheets, etc)

**Obrigatório:** `empresa_id` no body

```javascript
// Exemplo de envio do Google Sheets
const dados = {
  empresa_id: "1",  // ⭐ OBRIGATÓRIO
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "41999887766",
  origem: "Google Sheets",
  campanha: "Facebook Ads",
  interesse: "Produto X"
};

const response = await fetch('https://seu-backend.com/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dados)
});
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "41999887766",
    "stage": "entrou",
    "empresa": "Empresa ABC"
  },
  "message": "Lead recebido e salvo com sucesso"
}
```

### 2. **POST /api/leads/batch** - Receber Múltiplos Leads

```javascript
const dados = {
  leads: [
    {
      empresa_id: "1",
      nome: "João Silva",
      email: "joao@email.com",
      telefone: "41999887766"
    },
    {
      empresa_id: "1",
      nome: "Maria Santos",
      email: "maria@email.com",
      telefone: "41988776655"
    }
  ]
};

await fetch('https://seu-backend.com/api/leads/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dados)
});
```

### 3. **GET /api/leads** - Listar Leads (Com Permissionamento)

**Autenticação:** Obrigatória (sessão)

```javascript
// Frontend
const response = await fetch('/api/leads');
const resultado = await response.json();

// Retorna apenas leads das empresas que o usuário tem acesso
console.log(resultado.data); // Array de leads filtrados
```

### 4. **POST /api/leads/manual** - Adicionar Lead Manualmente

**Autenticação:** Obrigatória (sessão)  
**Validação:** Usuário USER só pode adicionar em suas empresas

```javascript
const dados = {
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "41999887766",
  empresa_id: "1",  // ⭐ OBRIGATÓRIO
  dados_extras: {
    origem: "Manual - Frontend",
    observacao: "Cliente indicado por parceiro"
  }
};

const response = await fetch('/api/leads/manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dados)
});
```

---

## 🎨 Frontend (crm.js)

### Função Principal: `carregarLeadsCRM()`

**Antes:**
```javascript
// Buscava de API externa (localhost:3001)
const response = await fetch('http://localhost:3001/api/v1/paginas/...');
```

**Agora:**
```javascript
// Busca do próprio backend (já filtrado por empresa)
const response = await fetch('/api/leads');
const resultado = await response.json();

// Processar leads do banco
resultado.data.forEach(lead => {
  processarLeadDoBanco(lead);
});
```

### Nova Função: `processarLeadDoBanco(lead)`

Converte lead do banco para o formato esperado pelo frontend:

```javascript
function processarLeadDoBanco(lead) {
  const nome = lead.nome || 'Nome não informado';
  const email = lead.email || 'Email não informado';
  const telefone = lead.telefone || 'Telefone não informado';
  const stage = lead.stage || 'entrou';
  
  const dadosOriginais = lead.dados_originais || {};
  const empresa = dadosOriginais.empresa || 'Empresa não informada';
  const origem = dadosOriginais.origem || 'Origem não informada';
  
  // Criar objeto normalizado
  const leadData = {
    id: lead.id,
    created_time: lead.created_at,
    nome, email, telefone, stage, empresa, origem,
    dados_originais: dadosOriginais,
    respostas: {
      full_name: [nome],
      email: [email],
      phone_number: [telefone]
    }
  };
  
  // Adicionar campos extras
  Object.keys(dadosOriginais).forEach(chave => {
    if (!['empresa_id', 'empresa', 'origem'].includes(chave)) {
      leadData.respostas[chave] = [dadosOriginais[chave]];
    }
  });
  
  window.leadsData.push(leadData);
  criarCardLead(leadData, stage);
}
```

---

## 📝 Exemplo Completo: Google Sheets → CRM

### 1. Estrutura da Planilha

| Nome | Email | Telefone | Empresa ID | Campanha | Interesse |
|------|-------|----------|------------|----------|-----------|
| João Silva | joao@email.com | 41999887766 | 1 | Facebook Ads | Produto X |
| Maria Santos | maria@email.com | 41988776655 | 1 | Google Ads | Serviço Y |

### 2. Apps Script

```javascript
function enviarLeadsParaCRM() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dados = planilha.getDataRange().getValues();
  
  // Pular cabeçalho (linha 1)
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    
    const lead = {
      empresa_id: linha[3].toString(), // ⭐ Coluna D (índice 3)
      nome: linha[0],
      email: linha[1],
      telefone: linha[2],
      campanha: linha[4],
      interesse: linha[5],
      origem: 'Google Sheets',
      data_importacao: new Date().toISOString()
    };
    
    // Enviar para o backend
    const url = 'https://seu-backend.com/api/leads';
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(lead)
    };
    
    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log('Lead enviado: ' + lead.nome);
    } catch (error) {
      Logger.log('Erro: ' + error);
    }
  }
}
```

### 3. Resultado no Banco

```sql
-- Lead inserido
SELECT 
  id,
  nome,
  email,
  telefone,
  stage,
  dados_originais
FROM leads
WHERE id = 1;

-- Resultado:
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "41999887766",
  "stage": "entrou",
  "dados_originais": {
    "empresa_id": "1",
    "empresa": "Empresa ABC",
    "campanha": "Facebook Ads",
    "interesse": "Produto X",
    "origem": "Google Sheets",
    "data_importacao": "2025-10-27T10:30:00Z"
  }
}
```

---

## 🔍 Consultas SQL Úteis

### Buscar Leads de Uma Empresa

```sql
SELECT * FROM leads 
WHERE dados_originais->>'empresa_id' = '1';
```

### Buscar Leads de Múltiplas Empresas (USER com várias empresas)

```sql
SELECT * FROM leads 
WHERE dados_originais->>'empresa_id' IN ('1', '2', '3');
```

### Buscar Leads por Campanha

```sql
SELECT * FROM leads 
WHERE dados_originais->>'campanha' = 'Facebook Ads';
```

### Contar Leads por Empresa e Stage

```sql
SELECT 
  dados_originais->>'empresa_id' as empresa_id,
  dados_originais->>'empresa' as empresa,
  stage,
  COUNT(*) as total
FROM leads
GROUP BY dados_originais->>'empresa_id', dados_originais->>'empresa', stage
ORDER BY empresa_id, stage;
```

### Listar Todos os Campos Únicos em `dados_originais`

```sql
SELECT DISTINCT jsonb_object_keys(dados_originais) as campo
FROM leads
ORDER BY campo;
```

---

## ⚡ Performance

### Índices Criados

1. **Busca por email:** `idx_leads_email`
2. **Busca por telefone:** `idx_leads_telefone`
3. **Filtro por stage:** `idx_leads_stage`
4. **Filtro por data:** `idx_leads_data_entrada`
5. **Busca em JSONB:** `idx_leads_dados_originais_gin` (GIN index)
6. **Filtro por empresa_id:** `idx_leads_empresa_id`

### Queries Otimizadas

✅ **Rápido:** `WHERE dados_originais->>'empresa_id' = '1'` (usa índice)  
✅ **Rápido:** `WHERE dados_originais @> '{"campanha": "Facebook"}'` (usa GIN)  
❌ **Lento:** `WHERE dados_originais::TEXT LIKE '%Facebook%'` (full scan)

---

## 🚀 Como Executar a Migração

### 1. Backup do Banco Atual

```bash
pg_dump -U seu_usuario -d seu_banco -t leads > backup_leads.sql
```

### 2. Executar SQL de Migração

```bash
psql -U seu_usuario -d seu_banco -f docs/leads-table-setup.sql
```

### 3. Migrar Dados Antigos (se houver)

```sql
-- Exemplo: Migrar dados da tabela antiga para nova estrutura
INSERT INTO leads (nome, email, telefone, data_contato, stage, dados_originais)
SELECT 
  nome,
  email,
  telefone,
  data_contato,
  stage,
  jsonb_build_object(
    'empresa_id', empresa_id::TEXT,
    'empresa', empresa,
    'origem', origem,
    'valor', valor,
    'observacao', observacao
  )
FROM leads_antiga;
```

### 4. Atualizar Código Backend/Frontend

- ✅ `CrmController.js` - Já atualizado
- ✅ `api.js` (rotas) - Já atualizado
- ✅ `crm.js` (frontend) - Já atualizado
- ✅ `leads-table-setup.sql` - Já atualizado

---

## 📌 Checklist Pós-Migração

- [ ] Executar SQL de criação da tabela
- [ ] Inserir dados de exemplo
- [ ] Testar rota `GET /api/leads` com usuário ADMIN
- [ ] Testar rota `GET /api/leads` com usuário USER
- [ ] Testar envio de lead via `POST /api/leads` (com empresa_id)
- [ ] Testar permissionamento: USER só vê leads de suas empresas
- [ ] Atualizar Apps Script do Google Sheets com `empresa_id`
- [ ] Verificar índices: `SELECT * FROM pg_indexes WHERE tablename = 'leads';`

---

## 🐛 Troubleshooting

### Problema: "empresa_id é obrigatório"

**Causa:** Enviando lead sem `empresa_id` no body  
**Solução:** Adicionar `empresa_id` em todos os leads enviados

```javascript
const dados = {
  empresa_id: "1", // ⭐ Adicionar isso
  nome: "João Silva",
  // ...
};
```

### Problema: Usuário USER não vê leads

**Causa:** Usuário não está vinculado a nenhuma empresa  
**Solução:** Vincular usuário à empresa na tabela `usuario_empresa`

```sql
INSERT INTO usuario_empresa (usuario_id, empresa_id)
VALUES (1, 1); -- usuario_id = 1, empresa_id = 1
```

### Problema: Consulta JSONB muito lenta

**Causa:** Índice GIN não foi criado  
**Solução:** Criar índice manualmente

```sql
CREATE INDEX idx_leads_dados_originais_gin 
ON leads USING GIN (dados_originais);
```

---

## 📚 Referências

- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin-intro.html)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Última atualização:** 27 de outubro de 2025  
**Versão:** 2.0 - Estrutura com Permissionamento por Empresa
