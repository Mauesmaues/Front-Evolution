# 🔧 cURL - Testes Rápidos do CRM

## 🚀 Comandos cURL Prontos para Copiar

### ✅ Teste 1: Enviar Lead com empresa_id (Sucesso)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "41999887766",
    "origem": "Google Sheets",
    "campanha": "Facebook Ads",
    "interesse": "Produto X"
  }'
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"empresa_id":"1","nome":"João Silva","email":"joao@email.com","telefone":"41999887766","origem":"Google Sheets","campanha":"Facebook Ads","interesse":"Produto X"}'
```

---

### ❌ Teste 2: Lead SEM empresa_id (Deve dar erro 400)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Erro",
    "email": "erro@email.com",
    "telefone": "41999999999"
  }'
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"nome":"Teste Erro","email":"erro@email.com","telefone":"41999999999"}'
```

---

### 📦 Teste 3: Enviar Múltiplos Leads (Batch)

```bash
curl -X POST http://localhost:3000/api/leads/batch \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "empresa_id": "1",
        "nome": "Maria Santos",
        "email": "maria@email.com",
        "telefone": "41988776655",
        "origem": "Google Sheets",
        "campanha": "Instagram Ads"
      },
      {
        "empresa_id": "1",
        "nome": "Pedro Costa",
        "email": "pedro@email.com",
        "telefone": "41977665544",
        "origem": "Google Sheets",
        "campanha": "Google Ads"
      }
    ]
  }'
```

**Windows (PowerShell):**
```powershell
$body = @{
  leads = @(
    @{
      empresa_id = "1"
      nome = "Maria Santos"
      email = "maria@email.com"
      telefone = "41988776655"
      origem = "Google Sheets"
      campanha = "Instagram Ads"
    },
    @{
      empresa_id = "1"
      nome = "Pedro Costa"
      email = "pedro@email.com"
      telefone = "41977665544"
      origem = "Google Sheets"
      campanha = "Google Ads"
    }
  )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/leads/batch" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

---

### 📋 Teste 4: Listar Leads (Requer Cookie de Sessão)

```bash
# Primeiro faça login e salve o cookie
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"senha123"}' \
  -c cookies.txt

# Depois liste os leads usando o cookie
curl -X GET http://localhost:3000/api/leads \
  -b cookies.txt
```

**Windows (PowerShell):**
```powershell
# Login (salva sessão automaticamente)
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@empresa.com","password":"senha123"}' -WebSession $session

# Listar leads (usa sessão salva)
Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method GET -WebSession $session
```

---

### ➕ Teste 5: Adicionar Lead Manual (Requer Login)

```bash
# Usar cookie da sessão (do Teste 4)
curl -X POST http://localhost:3000/api/leads/manual \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "nome": "Carlos Oliveira",
    "email": "carlos@email.com",
    "telefone": "41966554433",
    "empresa_id": "1",
    "dados_extras": {
      "observacao": "Cliente indicado",
      "prioridade": "Alta"
    }
  }'
```

**Windows (PowerShell):**
```powershell
# (Usar $session do Teste 4)
$body = @{
  nome = "Carlos Oliveira"
  email = "carlos@email.com"
  telefone = "41966554433"
  empresa_id = "1"
  dados_extras = @{
    observacao = "Cliente indicado"
    prioridade = "Alta"
  }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/leads/manual" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -WebSession $session
```

---

## 🌐 Testes com Ngrok

Se estiver usando Ngrok, substitua `localhost:3000` pela URL do Ngrok:

```bash
# Exemplo com Ngrok
curl -X POST https://abc123.ngrok.io/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "Teste Ngrok",
    "email": "ngrok@email.com",
    "telefone": "41999887766"
  }'
```

---

## 📊 Verificar Resposta com Formatação

### Linux/Mac (usando jq)
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "41999887766"
  }' | jq .
```

### Ver Código HTTP
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "João Silva",
    "email": "joao@email.com"
  }' \
  -w "\nHTTP Code: %{http_code}\n" \
  -s
```

---

## 🔍 Testes de Validação

### Teste: Lead sem nome
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "email": "teste@email.com"
  }'
```

### Teste: Lead sem email e sem telefone
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "Teste Sem Contato"
  }'
```

### Teste: Empresa inexistente
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "999",
    "nome": "Teste Empresa Fake",
    "email": "fake@email.com"
  }'
```

---

## 🎯 Script Completo de Teste (Bash)

Salve como `test-crm.sh` e execute:

```bash
#!/bin/bash

echo "🧪 Testando API do CRM..."
echo ""

# Teste 1
echo "✅ Teste 1: Enviar lead com empresa_id"
curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"empresa_id":"1","nome":"Teste 1","email":"teste1@email.com","telefone":"41999999999"}' \
  | jq .
echo ""
sleep 1

# Teste 2
echo "❌ Teste 2: Enviar lead SEM empresa_id (deve dar erro)"
curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste 2","email":"teste2@email.com"}' \
  | jq .
echo ""
sleep 1

# Teste 3
echo "📦 Teste 3: Enviar batch de leads"
curl -s -X POST http://localhost:3000/api/leads/batch \
  -H "Content-Type: application/json" \
  -d '{"leads":[{"empresa_id":"1","nome":"Batch 1","email":"batch1@email.com"},{"empresa_id":"1","nome":"Batch 2","email":"batch2@email.com"}]}' \
  | jq .
echo ""

echo "✅ Testes concluídos!"
```

**Tornar executável:**
```bash
chmod +x test-crm.sh
./test-crm.sh
```

---

## 🎯 Script PowerShell Completo

Salve como `test-crm.ps1` e execute:

```powershell
Write-Host "🧪 Testando API do CRM..." -ForegroundColor Cyan
Write-Host ""

# Teste 1
Write-Host "✅ Teste 1: Enviar lead com empresa_id" -ForegroundColor Green
$body1 = @{
  empresa_id = "1"
  nome = "Teste 1"
  email = "teste1@email.com"
  telefone = "41999999999"
} | ConvertTo-Json

$result1 = Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body1
$result1 | ConvertTo-Json
Write-Host ""
Start-Sleep -Seconds 1

# Teste 2
Write-Host "❌ Teste 2: Enviar lead SEM empresa_id (deve dar erro)" -ForegroundColor Yellow
$body2 = @{
  nome = "Teste 2"
  email = "teste2@email.com"
} | ConvertTo-Json

try {
  $result2 = Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body2
  $result2 | ConvertTo-Json
} catch {
  Write-Host "Erro esperado: $_" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 1

# Teste 3
Write-Host "📦 Teste 3: Enviar batch de leads" -ForegroundColor Green
$body3 = @{
  leads = @(
    @{
      empresa_id = "1"
      nome = "Batch 1"
      email = "batch1@email.com"
    },
    @{
      empresa_id = "1"
      nome = "Batch 2"
      email = "batch2@email.com"
    }
  )
} | ConvertTo-Json -Depth 3

$result3 = Invoke-RestMethod -Uri "http://localhost:3000/api/leads/batch" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body3
$result3 | ConvertTo-Json
Write-Host ""

Write-Host "✅ Testes concluídos!" -ForegroundColor Green
```

**Executar:**
```powershell
.\test-crm.ps1
```

---

## 📝 Respostas Esperadas

### ✅ Sucesso (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "41999887766",
    "stage": "entrou",
    "empresa": "Empresa ABC"
  },
  "message": "Lead recebido e salvo com sucesso"
}
```

### ❌ Erro - Sem empresa_id (400)
```json
{
  "success": false,
  "message": "Campo empresa_id é obrigatório nos dados do lead"
}
```

### ❌ Erro - Empresa não existe (400)
```json
{
  "success": false,
  "message": "Empresa com ID 999 não encontrada"
}
```

### ❌ Erro - Não autenticado (401)
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

---

## 🔧 Troubleshooting

### Erro: Connection refused
```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/leads
```
**Solução:** Iniciar servidor: `node server.js`

### Erro: Invalid JSON
```bash
# Verificar formato do JSON
echo '{"empresa_id":"1","nome":"Teste"}' | jq .
```

### Ver logs detalhados
```bash
curl -v -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"empresa_id":"1","nome":"Teste","email":"teste@email.com"}'
```

---

**Pronto para testar! Execute os comandos acima no seu terminal.** 🚀
