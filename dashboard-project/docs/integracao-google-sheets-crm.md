# 📊 Integração Google Sheets → CRM

## 🎯 Visão Geral

Sistema para enviar leads automaticamente do Google Sheets para o CRM via Apps Script.

---

## 🚀 Como Usar

### 1️⃣ Configurar URL do Backend

No seu código Apps Script, substitua a URL:

```javascript
const urlBackend = "https://seu-dominio.com/api/leads";
```

**Exemplos:**
- Produção: `https://seu-backend.com/api/leads`
- Local: `http://localhost:3000/api/leads`
- Ngrok: `https://xyz123.ngrok.io/api/leads`

---

### 2️⃣ Código Completo para Apps Script

Cole este código no editor do Google Apps Script:

```javascript
function enviarLeadsParaBackend() {
  // ======== CONFIGURAÇÕES ========
  const urlBackend = "https://seu-backend.com/api/leads"; // <-- TROQUE AQUI
  const sheetName = "Leads"; // nome da aba
  const colunaStatus = 16; // Coluna P = 16 (onde marca "crm")
  const colunasParaEnviar = [1, 2, 3, 4, 6, 8, 10]; // Colunas A, B, C, D, F, H, J
  // ========= FIM DAS CONFIGURAÇÕES =========

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("Nenhum dado para enviar");
    return;
  }

  // Pega cabeçalhos da linha 1
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Pega todos os dados (da linha 2 até a última)
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  let enviados = 0;
  let erros = 0;

  data.forEach((row, i) => {
    const status = row[colunaStatus - 1];

    // Só envia se a coluna de status estiver vazia
    if (status === "" || status === null) {
      
      // Cria objeto com apenas as colunas desejadas
      const lead = {};
      colunasParaEnviar.forEach((colIndex) => {
        const header = headers[colIndex - 1] || `col${colIndex}`;
        const valor = row[colIndex - 1];
        
        // Só adiciona se tiver valor
        if (valor !== "" && valor !== null && valor !== undefined) {
          lead[header] = valor;
        }
      });

      // Verifica se o lead tem algum dado
      if (Object.keys(lead).length === 0) {
        Logger.log(`Linha ${i + 2}: Lead vazio, pulando...`);
        return;
      }

      try {
        // Envia via POST
        const options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(lead),
          muteHttpExceptions: true // Para capturar erros HTTP
        };
        
        const response = UrlFetchApp.fetch(urlBackend, options);
        const statusCode = response.getResponseCode();
        
        if (statusCode === 201 || statusCode === 200) {
          // Sucesso: Marca coluna de status como "crm"
          sheet.getRange(i + 2, colunaStatus).setValue("crm");
          enviados++;
          Logger.log(`✅ Linha ${i + 2}: Lead enviado com sucesso`);
        } else {
          // Erro na API
          const errorText = response.getContentText();
          Logger.log(`❌ Linha ${i + 2}: Erro ${statusCode} - ${errorText}`);
          erros++;
        }
        
      } catch (e) {
        Logger.log(`❌ Linha ${i + 2}: Erro de conexão - ${e.message}`);
        erros++;
      }
    }
  });

  // Resumo
  Logger.log(`\n📊 RESUMO:`);
  Logger.log(`✅ Enviados: ${enviados}`);
  Logger.log(`❌ Erros: ${erros}`);
  Logger.log(`⏭️ Já processados: ${data.length - enviados - erros}`);
}

// Função auxiliar para testar com apenas 1 lead
function testarEnvioUmLead() {
  const urlBackend = "https://seu-backend.com/api/leads"; // <-- TROQUE AQUI
  
  const leadTeste = {
    "Nome": "João Silva - TESTE",
    "Email": "joao@teste.com",
    "Telefone": "41999887766",
    "Empresa": "Empresa Teste LTDA",
    "Origem": "Google Sheets - Teste Manual"
  };
  
  try {
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(leadTeste),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(urlBackend, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log(`Status: ${statusCode}`);
    Logger.log(`Resposta: ${responseText}`);
    
    if (statusCode === 201 || statusCode === 200) {
      Logger.log("✅ TESTE BEM-SUCEDIDO!");
    } else {
      Logger.log("❌ TESTE FALHOU!");
    }
  } catch (e) {
    Logger.log(`❌ Erro: ${e.message}`);
  }
}

// Função para criar gatilho automático (rodar 1x apenas)
function criarGatilhoAutomatico() {
  // Remove gatilhos existentes (evitar duplicação)
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'enviarLeadsParaBackend') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Criar novo gatilho: rodar a cada 10 minutos
  ScriptApp.newTrigger('enviarLeadsParaBackend')
    .timeBased()
    .everyMinutes(10)
    .create();
  
  Logger.log("✅ Gatilho criado! A função rodará a cada 10 minutos.");
}
```

---

## 📋 Configurações Importantes

### Colunas para Enviar

```javascript
const colunasParaEnviar = [1, 2, 3, 4, 6, 8, 10];
```

**Mapeamento:**
- `1` = Coluna A
- `2` = Coluna B
- `3` = Coluna C
- `4` = Coluna D
- `6` = Coluna F (pulou E)
- `8` = Coluna H (pulou G)
- `10` = Coluna J (pulou I)

**Exemplo de planilha:**
| A (Nome) | B (Email) | C (Telefone) | D (Empresa) | E (Ignorado) | F (Origem) |
|----------|-----------|--------------|-------------|--------------|------------|
| João     | joao@     | 41999...     | Empresa X   | ...          | Facebook   |

---

### Coluna de Status

```javascript
const colunaStatus = 16; // Coluna P
```

**Comportamento:**
- Se vazia → Envia o lead
- Depois do envio → Marca como "crm"
- Se já tem "crm" → Não envia novamente

---

## 🗺️ Mapeamento Automático de Campos

O backend aceita **qualquer nome de coluna** e mapeia automaticamente:

### Nomes de Campos Aceitos:

#### 👤 Nome
- `Nome`, `name`, `cliente`, `client`, `contato`, `contact`

#### 📧 Email
- `Email`, `e-mail`, `mail`, `email_address`

#### 📱 Telefone
- `Telefone`, `phone`, `whatsapp`, `celular`, `tel`, `mobile`

#### 🏢 Empresa
- `Empresa`, `company`, `negocio`, `business`, `organizacao`

#### 📍 Origem
- `Origem`, `source`, `canal`, `channel`

#### 📝 Observação
- `Observacao`, `obs`, `notes`, `notas`, `description`

#### 💰 Valor
- `Valor`, `value`, `price`, `preco`, `amount`

#### 📅 Data
- `Data`, `date`, `data_contato`, `contact_date`

---

## 📊 Exemplos de Planilhas

### Exemplo 1: Formato Simples
| Nome | Email | Telefone | Status |
|------|-------|----------|--------|
| João Silva | joao@email.com | 41999887766 | |
| Maria Santos | maria@email.com | 41988776655 | crm |

**Configuração:**
```javascript
const colunasParaEnviar = [1, 2, 3]; // A, B, C
const colunaStatus = 4; // D
```

---

### Exemplo 2: Formato Completo
| Cliente | E-mail | WhatsApp | Empresa | Origem | Observações | Enviado? |
|---------|--------|----------|---------|--------|-------------|----------|
| Pedro | pedro@ | 41999... | ABC Ltd | Site | Interessado | |

**Configuração:**
```javascript
const colunasParaEnviar = [1, 2, 3, 4, 5, 6]; // A até F
const colunaStatus = 7; // G
```

---

## 🧪 Testando a Integração

### 1️⃣ Teste Manual (1 lead)

1. Abra o editor de Apps Script
2. Execute a função: `testarEnvioUmLead`
3. Veja o log (Ctrl + Enter ou View → Logs)
4. Deve aparecer: `✅ TESTE BEM-SUCEDIDO!`

### 2️⃣ Teste com Planilha

1. Limpe a coluna de status de 1 ou 2 linhas
2. Execute: `enviarLeadsParaBackend`
3. Verifique:
   - ✅ Coluna de status marcada como "crm"
   - ✅ Lead aparece no CRM do sistema

### 3️⃣ Configurar Envio Automático

1. Execute **UMA VEZ**: `criarGatilhoAutomatico`
2. O sistema enviará leads a cada 10 minutos automaticamente
3. Para mudar frequência, edite: `.everyMinutes(10)` para `.everyHours(1)`, etc.

---

## 🔍 Verificando no Backend

### Logs do Servidor

Quando um lead chega, você verá no terminal:

```
📥 [CrmController] Lead recebido de fonte externa
📦 [CrmController] Dados brutos: {
  "Nome": "João Silva",
  "Email": "joao@email.com",
  "Telefone": "41999887766"
}
🗺️ [CrmController] Lead mapeado: {
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "41999887766",
  "origem": "Google Sheets"
}
✅ [CrmController] Lead salvo com sucesso - ID: 123
```

---

## 🛠️ Troubleshooting

### ❌ Erro: "Cannot connect to URL"
**Solução:** Verifique se a URL do backend está correta e acessível

### ❌ Erro 400: "Dados vazios"
**Solução:** Verifique se as colunas têm dados e se `colunasParaEnviar` está correto

### ❌ Erro 401/403: "Não autorizado"
**Solução:** A rota `/api/leads` é pública, não precisa autenticação

### ❌ Leads não aparecem no CRM
**Solução:**
1. Verifique se a tabela `leads` existe no Supabase
2. Confira os logs do servidor
3. Teste com `testarEnvioUmLead`

---

## 📊 Estrutura da Tabela no Supabase

Se a tabela `leads` não existir, crie com este SQL:

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

-- Índices para performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_telefone ON leads(telefone);
CREATE INDEX idx_leads_stage ON leads(stage);
```

---

## 🚀 Envio em Lote (Batch)

Para enviar múltiplos leads de uma vez (mais rápido):

```javascript
function enviarLeadsBatch() {
  const urlBackend = "https://seu-backend.com/api/leads/batch";
  const sheetName = "Leads";
  const colunaStatus = 16;
  const colunasParaEnviar = [1, 2, 3, 4, 6, 8, 10];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const leadsParaEnviar = [];
  const linhasParaMarcar = [];

  data.forEach((row, i) => {
    const status = row[colunaStatus - 1];

    if (status === "" || status === null) {
      const lead = {};
      colunasParaEnviar.forEach((colIndex) => {
        const header = headers[colIndex - 1] || `col${colIndex}`;
        const valor = row[colIndex - 1];
        if (valor !== "" && valor !== null) {
          lead[header] = valor;
        }
      });

      if (Object.keys(lead).length > 0) {
        leadsParaEnviar.push(lead);
        linhasParaMarcar.push(i + 2);
      }
    }
  });

  if (leadsParaEnviar.length === 0) {
    Logger.log("Nenhum lead novo para enviar");
    return;
  }

  try {
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ leads: leadsParaEnviar }),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(urlBackend, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 201 || statusCode === 200) {
      // Marcar todas as linhas como enviadas
      linhasParaMarcar.forEach(linha => {
        sheet.getRange(linha, colunaStatus).setValue("crm");
      });
      Logger.log(`✅ ${leadsParaEnviar.length} leads enviados com sucesso!`);
    } else {
      Logger.log(`❌ Erro ${statusCode}: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`❌ Erro: ${e.message}`);
  }
}
```

---

## 📞 Suporte

Dúvidas ou problemas? Verifique:
1. ✅ URL do backend está correta
2. ✅ Colunas configuradas corretamente
3. ✅ Servidor está rodando
4. ✅ Tabela `leads` existe no banco
5. ✅ Logs do Apps Script e do servidor

---

**Status:** ✅ Integração pronta para uso!
