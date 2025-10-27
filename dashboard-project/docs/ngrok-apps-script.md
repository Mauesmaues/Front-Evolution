# 🌐 Conectar Apps Script ao Localhost com Ngrok

## 🎯 Problema

Apps Script não consegue acessar `http://localhost:3000` porque está nos servidores do Google.

**Erro:**
```
DNS error: http://localhost:3000/api/leads
```

---

## ✅ Solução: Ngrok

**Ngrok** cria um túnel público (HTTPS) que aponta para seu localhost.

```
Google Apps Script → Ngrok (internet) → Seu localhost:3000
      ☁️                  🌐                    💻
```

---

## 📦 Instalação do Ngrok

### Windows (PowerShell)

#### Opção 1: Chocolatey
```powershell
choco install ngrok
```

#### Opção 2: Download Manual
1. Acesse: https://ngrok.com/download
2. Baixe o executável para Windows
3. Extraia para `C:\ngrok\`
4. Adicione ao PATH ou use direto da pasta

#### Opção 3: NPM
```powershell
npm install -g ngrok
```

---

## 🚀 Uso Passo a Passo

### 1️⃣ Inicie seu servidor Node.js
```powershell
cd c:\Users\artal\AreaDev\Front-Evolution\dashboard-project
node backend/server.js

# Servidor deve estar rodando em http://localhost:3000
```

### 2️⃣ Abra OUTRO terminal (PowerShell)
```powershell
# Mantenha o servidor rodando no primeiro terminal!
# Abra um segundo terminal para o ngrok
```

### 3️⃣ Execute o Ngrok
```powershell
ngrok http 3000
```

### 4️⃣ Copie a URL gerada
Você verá algo assim:
```
ngrok                                                                  

Session Status                online
Account                       seu@email.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copie esta URL:** `https://abc123xyz.ngrok.io`

---

## 📝 Atualizar Apps Script

### Antes (❌ Não funciona):
```javascript
const urlBackend = "http://localhost:3000/api/leads";
```

### Depois (✅ Funciona):
```javascript
const urlBackend = "https://abc123xyz.ngrok.io/api/leads"; // Sua URL do ngrok
```

---

## 🧪 Testar a Conexão

### 1️⃣ Testar no navegador
```
https://abc123xyz.ngrok.io/api/leads
```

Se aparecer erro 404 ou uma resposta JSON, está funcionando!

### 2️⃣ Testar no Apps Script
```javascript
// Execute esta função no Apps Script:
function testarConexao() {
  const url = "https://abc123xyz.ngrok.io/api/leads"; // Sua URL
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    Logger.log("Status: " + response.getResponseCode());
    Logger.log("Resposta: " + response.getContentText());
  } catch (e) {
    Logger.log("Erro: " + e.message);
  }
}
```

### 3️⃣ Testar envio de lead
```javascript
function testarEnvioUmLead() {
  const urlBackend = "https://abc123xyz.ngrok.io/api/leads"; // Sua URL
  
  const leadTeste = {
    "Nome": "João Teste Ngrok",
    "Email": "joao@teste.com",
    "Telefone": "41999887766"
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
    
    Logger.log("Status: " + statusCode);
    Logger.log("Resposta: " + response.getContentText());
    
    if (statusCode === 201 || statusCode === 200) {
      Logger.log("✅ TESTE BEM-SUCEDIDO!");
    } else {
      Logger.log("❌ TESTE FALHOU!");
    }
  } catch (e) {
    Logger.log("❌ Erro: " + e.message);
  }
}
```

---

## 🔍 Dashboard do Ngrok

Enquanto o ngrok está rodando, acesse:
```
http://127.0.0.1:4040
```

Você verá:
- ✅ Todas as requisições HTTP
- ✅ Headers enviados/recebidos
- ✅ Body das requisições
- ✅ Tempo de resposta

**Útil para debug!**

---

## ⚠️ Observações Importantes

### 1. URL Muda a Cada Execução (Free Plan)
```powershell
# Primeira vez
ngrok http 3000
# URL: https://abc123.ngrok.io

# Segunda vez (depois de fechar)
ngrok http 3000
# URL: https://xyz789.ngrok.io  ← DIFERENTE!
```

**Solução:** Atualizar URL no Apps Script toda vez.

**Ou:** Usar conta paga do ngrok para URL fixa.

### 2. Mantenha Terminal Aberto
```
❌ Fechou terminal → Túnel fecha → Apps Script para de funcionar
✅ Mantenha terminal aberto enquanto testa
```

### 3. HTTPS Automático
```
✅ Ngrok já fornece HTTPS automaticamente
✅ Certificado SSL válido
✅ Funciona no Apps Script sem problemas
```

---

## 🎯 Fluxo Completo de Trabalho

```
Terminal 1:
┌─────────────────────────────┐
│ node backend/server.js      │
│ Servidor rodando na porta   │
│ 3000...                     │
└─────────────────────────────┘

Terminal 2:
┌─────────────────────────────┐
│ ngrok http 3000             │
│ Túnel criado:               │
│ https://abc123.ngrok.io     │
└─────────────────────────────┘

Google Apps Script:
┌─────────────────────────────┐
│ const urlBackend =          │
│   "https://abc123.ngrok.io/ │
│    api/leads";              │
│                             │
│ // Executa função           │
│ enviarLeadsParaBackend();   │
└─────────────────────────────┘

Resultado:
✅ Leads enviados com sucesso!
✅ Aparecem no banco de dados
✅ Visíveis no CRM
```

---

## 🚀 Alternativas ao Ngrok

### 1. Localtunnel (Gratuito)
```powershell
npm install -g localtunnel
lt --port 3000
# URL: https://random-name.loca.lt
```

### 2. Cloudflare Tunnel (Gratuito)
```powershell
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```

### 3. Serveo (Gratuito, via SSH)
```powershell
ssh -R 80:localhost:3000 serveo.net
```

---

## 💡 Para Produção

**Não use ngrok em produção!**

Faça deploy em:
- **Render.com** (Gratuito) - Deploy automático via GitHub
- **Railway.app** (Gratuito) - Deploy fácil
- **Heroku** - Clássico e confiável
- **VPS próprio** - Controle total

Depois use URL permanente:
```javascript
const urlBackend = "https://seu-app.render.com/api/leads";
```

---

## 🛠️ Troubleshooting

### ❌ Erro: "command not found: ngrok"
**Solução:** Reinstale ou adicione ao PATH.

### ❌ Erro: "Tunnel not found"
**Solução:** Verifique se servidor está rodando na porta 3000.

### ❌ Erro: "Failed to complete tunnel"
**Solução:** 
1. Feche outros ngrok rodando
2. Tente outra porta
3. Verifique firewall

### ❌ Apps Script retorna 502/504
**Solução:**
1. Verifique se ngrok ainda está rodando
2. Teste URL no navegador
3. Veja logs do servidor Node.js

---

## 📊 Exemplo Completo

### 1. Terminal 1 (Servidor):
```powershell
PS C:\Users\artal\AreaDev\Front-Evolution\dashboard-project> node backend/server.js
Servidor rodando na porta 3000...
```

### 2. Terminal 2 (Ngrok):
```powershell
PS C:\> ngrok http 3000

ngrok
Forwarding  https://f3a2-179-123-45-67.ngrok.io -> http://localhost:3000
```

### 3. Apps Script:
```javascript
function enviarLeadsParaBackend() {
  const urlBackend = "https://f3a2-179-123-45-67.ngrok.io/api/leads";
  const sheetName = "Leads";
  const colunaStatus = 16;
  const colunasParaEnviar = [1, 2, 3];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    Logger.log("Nenhum dado para enviar");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  data.forEach((row, i) => {
    const status = row[colunaStatus - 1];

    if (status === "" || status === null) {
      const lead = {};
      colunasParaEnviar.forEach((colIndex) => {
        const header = headers[colIndex - 1];
        const valor = row[colIndex - 1];
        if (valor !== "" && valor !== null) {
          lead[header] = valor;
        }
      });

      if (Object.keys(lead).length === 0) return;

      try {
        const options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(lead),
          muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(urlBackend, options);
        const statusCode = response.getResponseCode();

        if (statusCode === 201 || statusCode === 200) {
          sheet.getRange(i + 2, colunaStatus).setValue("crm");
          Logger.log(`✅ Linha ${i + 2}: Lead enviado`);
        } else {
          Logger.log(`❌ Linha ${i + 2}: Erro ${statusCode}`);
        }
      } catch (e) {
        Logger.log(`❌ Linha ${i + 2}: ${e.message}`);
      }
    }
  });
}
```

### 4. Executar e Ver Resultado:
```
Terminal Node.js:
📥 [CrmController] Lead recebido de fonte externa
✅ [CrmController] Lead salvo com sucesso - ID: 1

Apps Script Log:
✅ Linha 2: Lead enviado
✅ Linha 3: Lead enviado
```

---

## ✅ Checklist

- [ ] Servidor Node.js rodando em localhost:3000
- [ ] Ngrok instalado
- [ ] Ngrok rodando: `ngrok http 3000`
- [ ] URL do ngrok copiada
- [ ] URL atualizada no Apps Script
- [ ] Teste de conexão funcionando
- [ ] Leads sendo enviados com sucesso
- [ ] Leads aparecendo no banco/CRM

---

**Status:** 🎯 Pronto para testar com Ngrok! Execute os comandos acima e atualize a URL no Apps Script.
