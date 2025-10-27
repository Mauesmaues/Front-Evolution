# ✅ Integração Google Sheets → CRM - Implementação Completa

## 📋 Resumo das Alterações

### 🎯 Objetivo
Criar rotas flexíveis no backend para receber leads do Google Sheets via Apps Script, aceitando **qualquer estrutura de dados** que você enviar.

---

## 🚀 O Que Foi Implementado

### 1. **Backend - Controller CRM**
📄 **Arquivo:** `backend/controllers/CrmController.js` (NOVO)

**Funcionalidades:**
- ✅ Recebe lead único via POST `/api/leads`
- ✅ Recebe múltiplos leads via POST `/api/leads/batch`
- ✅ Mapeia automaticamente nomes de campos em PT/EN
- ✅ Aceita campos personalizados (salvos em JSON)
- ✅ Validação inteligente de dados
- ✅ Logs detalhados para debug

**Campos Mapeados Automaticamente:**
| Campo na Planilha | Salvo como |
|-------------------|------------|
| Nome, name, cliente, client | `nome` |
| Email, e-mail, mail | `email` |
| Telefone, phone, whatsapp, celular | `telefone` |
| Empresa, company, negocio | `empresa` |
| Origem, source, canal | `origem` |
| Observacao, obs, notes | `observacao` |
| Valor, value, price | `valor` |
| Data, date, data_contato | `data_contato` |

**Campos não mapeados** → Salvos em `campos_extras` (JSON)

---

### 2. **Backend - Rotas da API**
📄 **Arquivo:** `backend/routes/api.js` (ATUALIZADO)

**Novas rotas:**
```javascript
POST /api/leads          // Receber 1 lead
POST /api/leads/batch    // Receber múltiplos leads
```

**Características:**
- ✅ Rotas públicas (sem autenticação)
- ✅ Aceita JSON no body
- ✅ CORS habilitado (se configurado no servidor)

---

### 3. **Documentação Completa**
📄 **Arquivo:** `docs/integracao-google-sheets-crm.md`

**Contém:**
- ✅ Código completo do Apps Script
- ✅ Instruções passo a passo
- ✅ Exemplos de configuração
- ✅ Função de teste
- ✅ Gatilho automático
- ✅ Envio em lote (batch)
- ✅ Troubleshooting

---

### 4. **Script SQL da Tabela**
📄 **Arquivo:** `docs/leads-table-setup.sql`

**Estrutura da tabela `leads`:**
```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  origem TEXT DEFAULT 'Google Sheets',
  observacao TEXT,
  valor NUMERIC,
  data_contato TEXT,
  data_entrada TIMESTAMP DEFAULT NOW(),
  stage TEXT DEFAULT 'entrou',
  dados_originais JSONB,
  campos_extras JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Inclui:**
- ✅ Índices para performance
- ✅ Trigger para `updated_at`
- ✅ Comentários explicativos
- ✅ Dados de exemplo

---

## 🔧 Como Usar

### 1️⃣ Configurar Banco de Dados

Execute o SQL no Supabase:
```bash
# Copie o conteúdo de: docs/leads-table-setup.sql
# Cole no SQL Editor do Supabase
# Clique em RUN
```

---

### 2️⃣ Configurar Google Apps Script

1. Abra sua planilha no Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. Cole o código de `docs/integracao-google-sheets-crm.md`
4. **CONFIGURE:**
   ```javascript
   const urlBackend = "https://seu-dominio.com/api/leads"; // <-- SUA URL
   const colunaStatus = 16; // Coluna que marca "crm"
   const colunasParaEnviar = [1, 2, 3, 4, 6]; // Colunas A, B, C, D, F
   ```

---

### 3️⃣ Testar

**Teste Manual (1 lead):**
```javascript
// No Apps Script, execute:
testarEnvioUmLead()

// Veja o log (Ctrl + Enter)
// Deve aparecer: ✅ TESTE BEM-SUCEDIDO!
```

**Teste com Planilha:**
```javascript
// Limpe a coluna de status de 1-2 linhas
// Execute:
enviarLeadsParaBackend()

// Verifique:
// ✅ Coluna marcada como "crm"
// ✅ Lead aparece no CRM
```

---

### 4️⃣ Automatizar (Opcional)

**Executar a cada 10 minutos:**
```javascript
// No Apps Script, execute UMA VEZ:
criarGatilhoAutomatico()

// O sistema enviará leads automaticamente
```

---

## 📊 Fluxo Completo

```
┌─────────────────┐
│ Google Sheets   │
│ (Planilha)      │
└────────┬────────┘
         │
         │ Apps Script envia POST
         │ a cada 10 min
         ↓
┌─────────────────┐
│ Backend Node.js │
│ /api/leads      │
└────────┬────────┘
         │
         │ Mapeia campos
         │ automaticamente
         ↓
┌─────────────────┐
│ Supabase        │
│ Tabela: leads   │
└────────┬────────┘
         │
         │ Dados salvos
         ↓
┌─────────────────┐
│ CRM Frontend    │
│ (Kanban)        │
└─────────────────┘
```

---

## 🔍 Exemplos de Uso

### Exemplo 1: Planilha Simples

**Planilha:**
| A: Nome | B: Email | C: Telefone | D: Status |
|---------|----------|-------------|-----------|
| João    | joao@    | 41999...    |           |

**Configuração:**
```javascript
const colunasParaEnviar = [1, 2, 3]; // A, B, C
const colunaStatus = 4; // D
```

**Enviado para backend:**
```json
{
  "Nome": "João",
  "Email": "joao@",
  "Telefone": "41999..."
}
```

**Salvo no banco:**
```json
{
  "nome": "João",
  "email": "joao@",
  "telefone": "41999...",
  "origem": "Google Sheets",
  "stage": "entrou"
}
```

---

### Exemplo 2: Planilha Complexa

**Planilha:**
| A: Cliente | B: E-mail | C: WhatsApp | D: Empresa | E: Campanha | F: Interesse | G: Status |
|------------|-----------|-------------|------------|-------------|--------------|-----------|
| Maria      | maria@    | 41988...    | ABC Ltd    | Facebook    | Produto X    |           |

**Configuração:**
```javascript
const colunasParaEnviar = [1, 2, 3, 4, 5, 6]; // A até F
const colunaStatus = 7; // G
```

**Enviado:**
```json
{
  "Cliente": "Maria",
  "E-mail": "maria@",
  "WhatsApp": "41988...",
  "Empresa": "ABC Ltd",
  "Campanha": "Facebook",
  "Interesse": "Produto X"
}
```

**Salvo:**
```json
{
  "nome": "Maria",          // mapeado de "Cliente"
  "email": "maria@",        // mapeado de "E-mail"
  "telefone": "41988...",   // mapeado de "WhatsApp"
  "empresa": "ABC Ltd",
  "origem": "Google Sheets",
  "stage": "entrou",
  "campos_extras": {
    "Campanha": "Facebook",
    "Interesse": "Produto X"
  }
}
```

---

## 🛡️ Segurança

### Validações Implementadas:

1. ✅ **Dados não vazios** - Lead deve ter pelo menos 1 campo
2. ✅ **Identificação mínima** - Deve ter nome OU email OU telefone
3. ✅ **Proteção contra duplicação** - Coluna de status impede reenvio
4. ✅ **Logs detalhados** - Todos erros são registrados
5. ✅ **Tratamento de exceções** - Erros não travam o processo

---

## 📞 Troubleshooting

### ❌ Erro: "Cannot connect to URL"
**Causa:** URL incorreta ou servidor offline  
**Solução:** 
- Verifique a URL no Apps Script
- Teste manualmente: `curl https://sua-url.com/api/leads`

### ❌ Erro 400: "Dados vazios"
**Causa:** Nenhum dado nas colunas selecionadas  
**Solução:** 
- Verifique se `colunasParaEnviar` está correto
- Confirme que as colunas têm dados

### ❌ Leads não aparecem no CRM
**Causa:** Tabela `leads` não existe ou erro no banco  
**Solução:**
- Execute o SQL: `docs/leads-table-setup.sql`
- Verifique logs do servidor
- Teste com `testarEnvioUmLead()`

### ❌ Status não é marcado como "crm"
**Causa:** Erro ao enviar ou `colunaStatus` incorreto  
**Solução:**
- Verifique o log do Apps Script
- Confirme número da coluna (P = 16)
- Veja resposta do servidor (status 201/200)

---

## 📈 Melhorias Futuras (Opcional)

1. **Autenticação** - Adicionar API key para segurança
2. **Webhook** - Notificar Slack/Discord quando lead chega
3. **Deduplicação** - Verificar se lead já existe (por email/telefone)
4. **Enriquecimento** - Buscar dados extras (LinkedIn, etc)
5. **Dashboard** - Estatísticas de leads importados
6. **Validação** - Validar formato de email/telefone
7. **Campos obrigatórios** - Configurar campos mínimos necessários

---

## ✅ Checklist de Implementação

- [ ] Executar SQL da tabela `leads` no Supabase
- [ ] Configurar URL do backend no Apps Script
- [ ] Configurar colunas da planilha
- [ ] Testar com 1 lead (`testarEnvioUmLead`)
- [ ] Testar com planilha real (`enviarLeadsParaBackend`)
- [ ] Verificar lead no CRM frontend
- [ ] Criar gatilho automático (opcional)
- [ ] Documentar estrutura da planilha para equipe

---

## 📚 Arquivos Criados/Modificados

1. ✅ `backend/controllers/CrmController.js` - NOVO
2. ✅ `backend/routes/api.js` - Adicionadas rotas `/api/leads`
3. ✅ `docs/integracao-google-sheets-crm.md` - Documentação completa
4. ✅ `docs/leads-table-setup.sql` - Script da tabela
5. ✅ `docs/resumo-integracao-crm.md` - Este arquivo

---

## 🎉 Status

**IMPLEMENTAÇÃO COMPLETA** ✅

O sistema está pronto para:
- ✅ Receber leads do Google Sheets
- ✅ Aceitar qualquer formato de dados
- ✅ Mapear campos automaticamente
- ✅ Salvar no banco de dados
- ✅ Exibir no CRM frontend
- ✅ Logs detalhados para debug

---

**Próximo passo:** Testar a integração! 🚀
