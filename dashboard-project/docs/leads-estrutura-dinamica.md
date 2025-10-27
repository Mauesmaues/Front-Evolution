# 🗄️ Leads com Estrutura Dinâmica - Solução Completa

## 🎯 Problema

Como guardar leads no banco de dados quando **as informações mudam conforme o envio** da planilha?

**Exemplo:**
- Planilha 1: Nome, Email, Telefone
- Planilha 2: Cliente, E-mail, WhatsApp, Empresa, Campanha, Interesse
- Planilha 3: Nome, Contato, Produto, Valor, Data

Cada planilha tem colunas diferentes! 😱

---

## ✅ Solução: Campos JSONB

Usamos **JSONB** (JSON binário) do PostgreSQL/Supabase que permite:
- ✅ Guardar **qualquer estrutura** de dados
- ✅ Campos diferentes para cada lead
- ✅ Adicionar novos campos **sem alterar a tabela**
- ✅ Buscar dentro dos campos dinâmicos (indexed!)
- ✅ Performance otimizada com índices GIN

---

## 📊 Estrutura da Tabela

### Campos Fixos (para busca rápida)
```sql
id              SERIAL PRIMARY KEY
nome            TEXT           -- Nome do lead
email           TEXT           -- Email (para busca)
telefone        TEXT           -- Telefone (para busca)
empresa         TEXT           -- Empresa
origem          TEXT           -- De onde veio o lead
observacao      TEXT           -- Notas
valor           NUMERIC        -- Valor do negócio
stage           TEXT           -- entrou/agendou/analisando/fechou
data_entrada    TIMESTAMP      -- Quando entrou no sistema
```

### Campos Dinâmicos (JSONB) ⭐
```sql
dados_originais JSONB    -- Dados EXATOS da planilha
campos_extras   JSONB    -- Campos não mapeados
```

---

## 🔄 Como Funciona

### 1️⃣ Você envia da planilha:
```json
{
  "Cliente": "João Silva",
  "E-mail": "joao@empresa.com",
  "WhatsApp": "41999887766",
  "Empresa": "Empresa ABC",
  "Campanha": "Facebook Ads",
  "Interesse": "Produto X",
  "Orçamento": "R$ 5.000"
}
```

### 2️⃣ Backend mapeia campos comuns:
```json
{
  "nome": "João Silva",      // de "Cliente"
  "email": "joao@empresa.com", // de "E-mail"
  "telefone": "41999887766"    // de "WhatsApp"
}
```

### 3️⃣ Guarda dados originais em JSONB:
```json
dados_originais = {
  "Cliente": "João Silva",
  "E-mail": "joao@empresa.com",
  "WhatsApp": "41999887766",
  "Empresa": "Empresa ABC",
  "Campanha": "Facebook Ads",
  "Interesse": "Produto X",
  "Orçamento": "R$ 5.000"
}
```

### 4️⃣ Campos extras separados:
```json
campos_extras = {
  "Campanha": "Facebook Ads",
  "Interesse": "Produto X",
  "Orçamento": "R$ 5.000"
}
```

---

## 📝 Exemplos de Dados Salvos

### Lead da Planilha 1 (simples)
```sql
INSERT INTO leads (nome, email, telefone, dados_originais) VALUES (
  'Maria Santos',
  'maria@email.com',
  '41988776655',
  '{"Nome": "Maria Santos", "Email": "maria@email.com", "Telefone": "41988776655"}'
);
```

### Lead da Planilha 2 (completo)
```sql
INSERT INTO leads (nome, email, telefone, empresa, dados_originais, campos_extras) VALUES (
  'Pedro Oliveira',
  'pedro@empresa.com',
  '41977665544',
  'Tech Corp',
  '{"Cliente": "Pedro", "E-mail": "pedro@", "WhatsApp": "41977...", "Empresa": "Tech", "Campanha": "Google", "Status": "Novo"}',
  '{"Campanha": "Google Ads", "Status": "Novo"}'
);
```

### Lead da Planilha 3 (customizada)
```sql
INSERT INTO leads (nome, telefone, dados_originais, campos_extras) VALUES (
  'Ana Costa',
  '41966554433',
  '{"Nome": "Ana", "Contato": "41966...", "Produto": "Service A", "Valor": "R$ 10.000", "Data": "2025-10-27"}',
  '{"Produto": "Service A", "Valor": "R$ 10.000", "Data": "2025-10-27"}'
);
```

---

## 🔍 Consultas Poderosas

### 1️⃣ Buscar leads de uma campanha específica
```sql
SELECT id, nome, email, dados_originais->>'Campanha' as campanha
FROM leads
WHERE dados_originais->>'Campanha' = 'Facebook Ads';
```

**Resultado:**
| id | nome | email | campanha |
|----|------|-------|----------|
| 1 | João | joao@ | Facebook Ads |
| 5 | Maria | maria@ | Facebook Ads |

---

### 2️⃣ Contar leads por campanha
```sql
SELECT 
  dados_originais->>'Campanha' as campanha, 
  COUNT(*) as total
FROM leads
WHERE dados_originais ? 'Campanha'
GROUP BY dados_originais->>'Campanha'
ORDER BY total DESC;
```

**Resultado:**
| campanha | total |
|----------|-------|
| Facebook Ads | 25 |
| Google Ads | 18 |
| LinkedIn | 12 |

---

### 3️⃣ Buscar leads interessados em produto específico
```sql
SELECT nome, email, campos_extras->>'Produto' as produto
FROM leads
WHERE campos_extras->>'Produto' = 'Service A';
```

---

### 4️⃣ Buscar leads com orçamento acima de R$ 5.000
```sql
SELECT nome, email, dados_originais->>'Orçamento' as orcamento
FROM leads
WHERE (dados_originais->>'Valor')::numeric > 5000;
```

---

### 5️⃣ Listar TODOS os campos que já foram enviados
```sql
SELECT DISTINCT jsonb_object_keys(dados_originais) as campo
FROM leads
ORDER BY campo;
```

**Resultado:**
```
campo
-----------------
Campanha
Cliente
Contato
E-mail
Empresa
Interesse
Nome
Orçamento
Produto
Status
Telefone
Valor
WhatsApp
```

---

### 6️⃣ Ver estrutura completa de um lead
```sql
SELECT 
  id,
  nome,
  email,
  jsonb_pretty(dados_originais) as dados_completos
FROM leads
WHERE id = 1;
```

**Resultado:**
```json
{
  "Cliente": "João Silva",
  "E-mail": "joao@empresa.com",
  "WhatsApp": "41999887766",
  "Empresa": "Empresa ABC",
  "Campanha": "Facebook Ads",
  "Interesse": "Produto X"
}
```

---

## 🎨 No Frontend (CRM)

### Exibir dados dinâmicos no card do lead:

```javascript
// JavaScript
const lead = {
  id: 1,
  nome: "João Silva",
  email: "joao@empresa.com",
  dados_originais: {
    "Campanha": "Facebook Ads",
    "Interesse": "Produto X",
    "Orçamento": "R$ 5.000"
  }
};

// Renderizar campos extras
Object.entries(lead.dados_originais).forEach(([campo, valor]) => {
  console.log(`${campo}: ${valor}`);
});

// Saída:
// Campanha: Facebook Ads
// Interesse: Produto X
// Orçamento: R$ 5.000
```

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────┐
│ PLANILHA 1                          │
│ Colunas: Nome, Email, Telefone      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ PLANILHA 2                          │
│ Colunas: Cliente, E-mail, WhatsApp, │
│          Empresa, Campanha          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ PLANILHA 3                          │
│ Colunas: Nome, Contato, Produto,    │
│          Valor, Data                │
└──────────────┬──────────────────────┘
               │
               ↓ Apps Script envia
┌─────────────────────────────────────┐
│ BACKEND - CrmController             │
│ Mapeia campos comuns                │
│ Guarda TUDO em dados_originais      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ BANCO DE DADOS (Supabase)           │
│ ┌─────────────────────────────────┐ │
│ │ Campos Fixos:                   │ │
│ │ - nome: "João"                  │ │
│ │ - email: "joao@"                │ │
│ │ - telefone: "41999..."          │ │
│ ├─────────────────────────────────┤ │
│ │ dados_originais (JSONB):        │ │
│ │ {                               │ │
│ │   "Cliente": "João",            │ │
│ │   "Campanha": "Facebook",       │ │
│ │   "Interesse": "Produto X"      │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ FRONTEND - CRM Kanban               │
│ Exibe campos fixos + dinâmicos      │
└─────────────────────────────────────┘
```

---

## 💡 Vantagens da Solução

### ✅ Flexibilidade Total
- Cada planilha pode ter colunas diferentes
- Adicionar novos campos sem alterar banco
- Estrutura adapta-se automaticamente

### ✅ Performance
- Campos comuns (nome, email) indexados
- Busca rápida em campos fixos
- JSONB com índice GIN para campos dinâmicos

### ✅ Histórico Completo
- `dados_originais` guarda EXATAMENTE o que foi enviado
- Nunca perde informação
- Possível rastrear origem dos dados

### ✅ Consultas Poderosas
- SQL pode buscar dentro do JSON
- Agregações (COUNT, GROUP BY) funcionam
- Filtros complexos possíveis

---

## 🛠️ Código no Backend (Já Implementado)

O `CrmController.js` já faz tudo isso automaticamente:

```javascript
// 1. Recebe dados da planilha
const dadosRecebidos = req.body;
// { "Cliente": "João", "E-mail": "joao@", "Campanha": "Facebook" }

// 2. Mapeia campos comuns
const leadMapeado = mapearCamposLead(dadosRecebidos);
// { nome: "João", email: "joao@" }

// 3. Adiciona dados originais
leadMapeado.dados_originais = dadosRecebidos;
// Guarda TUDO que veio da planilha

// 4. Separa campos extras
leadMapeado.campos_extras = { "Campanha": "Facebook" };
// Campos que não foram mapeados

// 5. Salva no banco
await supabase.from('leads').insert([leadMapeado]);
```

---

## 📊 Exemplo Real Completo

### Planilha enviada:
| Cliente | E-mail | WhatsApp | Empresa | Campanha | Interesse | Orçamento |
|---------|--------|----------|---------|----------|-----------|-----------|
| Ana Lima | ana@tech.com | 41966554433 | TechCorp | LinkedIn | ERP | R$ 15.000 |

### Salvo no banco:
```sql
id: 42
nome: "Ana Lima"
email: "ana@tech.com"
telefone: "41966554433"
empresa: "TechCorp"
origem: "Google Sheets"
stage: "entrou"
data_entrada: "2025-10-27 14:30:00"

dados_originais: {
  "Cliente": "Ana Lima",
  "E-mail": "ana@tech.com",
  "WhatsApp": "41966554433",
  "Empresa": "TechCorp",
  "Campanha": "LinkedIn",
  "Interesse": "ERP",
  "Orçamento": "R$ 15.000"
}

campos_extras: {
  "Campanha": "LinkedIn",
  "Interesse": "ERP",
  "Orçamento": "R$ 15.000"
}
```

### Consultando depois:
```sql
-- Buscar leads do LinkedIn interessados em ERP
SELECT 
  nome,
  email,
  dados_originais->>'Campanha' as campanha,
  dados_originais->>'Interesse' as interesse,
  dados_originais->>'Orçamento' as orcamento
FROM leads
WHERE dados_originais->>'Campanha' = 'LinkedIn'
  AND dados_originais->>'Interesse' = 'ERP';
```

**Resultado:**
| nome | email | campanha | interesse | orcamento |
|------|-------|----------|-----------|-----------|
| Ana Lima | ana@tech.com | LinkedIn | ERP | R$ 15.000 |

---

## 🎉 Conclusão

Com esta solução:
- ✅ **Qualquer planilha funciona** - não importa as colunas
- ✅ **Nada se perde** - tudo é guardado em `dados_originais`
- ✅ **Busca é rápida** - campos comuns indexados
- ✅ **Consultas flexíveis** - JSONB permite tudo
- ✅ **Futuro à prova** - novos campos não quebram nada

---

## 📚 Arquivos Relacionados

- ✅ `backend/controllers/CrmController.js` - Lógica de mapeamento
- ✅ `docs/leads-table-setup.sql` - SQL da tabela com JSONB
- ✅ `docs/integracao-google-sheets-crm.md` - Como enviar da planilha

---

**Status:** ✅ Solução implementada e pronta para leads com estrutura variável! 🚀
