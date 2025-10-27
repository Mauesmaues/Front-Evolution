# 📮 Postman - Testes do CRM

## 🚀 Como Importar no Postman

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Cole o JSON da coleção abaixo
4. OU crie as requisições manualmente seguindo os exemplos

---

## 📦 Coleção Postman (JSON para Importar)

```json
{
  "info": {
    "name": "CRM - Leads API",
    "description": "Testes das rotas de CRM com permissionamento por empresa",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Receber Lead Externo (Google Sheets)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"empresa_id\": \"1\",\n  \"nome\": \"João Silva\",\n  \"email\": \"joao@email.com\",\n  \"telefone\": \"41999887766\",\n  \"origem\": \"Google Sheets\",\n  \"campanha\": \"Facebook Ads\",\n  \"interesse\": \"Produto X\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/leads",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "leads"]
        }
      }
    },
    {
      "name": "2. Receber Lead - SEM empresa_id (Deve dar erro)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nome\": \"Teste Erro\",\n  \"email\": \"erro@email.com\",\n  \"telefone\": \"41999999999\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/leads",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "leads"]
        }
      }
    },
    {
      "name": "3. Receber Múltiplos Leads (Batch)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"leads\": [\n    {\n      \"empresa_id\": \"1\",\n      \"nome\": \"Maria Santos\",\n      \"email\": \"maria@email.com\",\n      \"telefone\": \"41988776655\",\n      \"origem\": \"Google Sheets\",\n      \"campanha\": \"Instagram Ads\"\n    },\n    {\n      \"empresa_id\": \"1\",\n      \"nome\": \"Pedro Costa\",\n      \"email\": \"pedro@email.com\",\n      \"telefone\": \"41977665544\",\n      \"origem\": \"Google Sheets\",\n      \"campanha\": \"Google Ads\"\n    }\n  ]\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/leads/batch",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "leads", "batch"]
        }
      }
    },
    {
      "name": "4. Listar Leads (Requer Login)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/leads",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "leads"]
        }
      }
    },
    {
      "name": "5. Adicionar Lead Manual (Requer Login)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nome\": \"Carlos Oliveira\",\n  \"email\": \"carlos@email.com\",\n  \"telefone\": \"41966554433\",\n  \"empresa_id\": \"1\",\n  \"dados_extras\": {\n    \"observacao\": \"Cliente indicado por parceiro\",\n    \"origem\": \"Manual - Postman\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/leads/manual",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "leads", "manual"]
        }
      }
    }
  ]
}
```

---

## 🧪 Testes Individuais (Copiar e Colar)

### ✅ Teste 1: Receber Lead Externo (Sucesso)

**Método:** `POST`  
**URL:** `http://localhost:3000/api/leads`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "empresa_id": "1",
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "41999887766",
  "origem": "Google Sheets",
  "campanha": "Facebook Ads",
  "interesse": "Produto X",
  "observacao": "Cliente em potencial"
}
```

**Resposta Esperada (201):**
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

---

### ❌ Teste 2: Lead SEM empresa_id (Deve dar erro)

**Método:** `POST`  
**URL:** `http://localhost:3000/api/leads`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nome": "Teste Erro",
  "email": "erro@email.com",
  "telefone": "41999999999"
}
```

**Resposta Esperada (400):**
```json
{
  "success": false,
  "message": "Campo empresa_id é obrigatório nos dados do lead"
}
```

---

### 📦 Teste 3: Enviar Múltiplos Leads (Batch)

**Método:** `POST`  
**URL:** `http://localhost:3000/api/leads/batch`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "leads": [
    {
      "empresa_id": "1",
      "nome": "Maria Santos",
      "email": "maria@email.com",
      "telefone": "41988776655",
      "origem": "Google Sheets",
      "campanha": "Instagram Ads",
      "interesse": "Serviço Y"
    },
    {
      "empresa_id": "1",
      "nome": "Pedro Costa",
      "email": "pedro@email.com",
      "telefone": "41977665544",
      "origem": "Google Sheets",
      "campanha": "Google Ads",
      "interesse": "Produto Z"
    },
    {
      "empresa_id": "2",
      "nome": "Ana Paula",
      "email": "ana@email.com",
      "telefone": "41966554433",
      "origem": "Google Sheets",
      "campanha": "LinkedIn Ads",
      "interesse": "Consultoria"
    }
  ]
}
```

**Resposta Esperada (201):**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "leads": [
      {
        "id": 2,
        "nome": "Maria Santos",
        "email": "maria@email.com",
        "telefone": "41988776655",
        "stage": "entrou"
      },
      {
        "id": 3,
        "nome": "Pedro Costa",
        "email": "pedro@email.com",
        "telefone": "41977665544",
        "stage": "entrou"
      },
      {
        "id": 4,
        "nome": "Ana Paula",
        "email": "ana@email.com",
        "telefone": "41966554433",
        "stage": "entrou"
      }
    ]
  },
  "message": "3 leads recebidos e salvos com sucesso"
}
```

---

### 📋 Teste 4: Listar Leads (Requer Login)

**Método:** `GET`  
**URL:** `http://localhost:3000/api/leads`  
**Headers:** Nenhum (sessão automática via cookie)

**Resposta Esperada (200) - Usuário ADMIN:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "41999887766",
      "data_contato": "2025-10-27T10:30:00.000Z",
      "stage": "entrou",
      "data_entrada": "2025-10-27T10:30:00.000Z",
      "dados_originais": {
        "empresa_id": "1",
        "empresa": "Empresa ABC",
        "origem": "Google Sheets",
        "campanha": "Facebook Ads",
        "interesse": "Produto X"
      },
      "created_at": "2025-10-27T10:30:00.000Z",
      "updated_at": "2025-10-27T10:30:00.000Z"
    }
  ],
  "message": "1 leads encontrados"
}
```

**Resposta Esperada (401) - Sem Login:**
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

---

### ➕ Teste 5: Adicionar Lead Manual (Requer Login)

**Método:** `POST`  
**URL:** `http://localhost:3000/api/leads/manual`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nome": "Carlos Oliveira",
  "email": "carlos@email.com",
  "telefone": "41966554433",
  "empresa_id": "1",
  "dados_extras": {
    "observacao": "Cliente indicado por parceiro João",
    "fonte": "Indicação",
    "prioridade": "Alta"
  }
}
```

**Resposta Esperada (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "Carlos Oliveira",
    "email": "carlos@email.com",
    "telefone": "41966554433",
    "data_contato": "2025-10-27T14:30:00.000Z",
    "stage": "entrou",
    "data_entrada": "2025-10-27T14:30:00.000Z",
    "dados_originais": {
      "empresa_id": "1",
      "empresa": "Empresa ABC",
      "origem": "Manual - Frontend",
      "criado_por": "Admin User",
      "criado_por_id": 1,
      "observacao": "Cliente indicado por parceiro João",
      "fonte": "Indicação",
      "prioridade": "Alta"
    }
  },
  "message": "Lead adicionado com sucesso"
}
```

---

## 🔐 Como Fazer Login no Postman (Para Testes 4 e 5)

### Método 1: Login via Navegador (Recomendado)

1. Abra o navegador e faça login em `http://localhost:3000`
2. No Postman, vá em **Cookies** (ícone embaixo da URL)
3. Clique em **Add Cookie**
4. Adicione o cookie de sessão do navegador

### Método 2: Login via Postman

**Criar requisição de Login:**

**Método:** `POST`  
**URL:** `http://localhost:3000/api/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@empresa.com",
  "password": "senha123"
}
```

**Resposta:**
- Cookie de sessão será salvo automaticamente pelo Postman
- Próximas requisições usarão esse cookie

---

## 🧪 Testes de Permissionamento

### Teste 6: Usuário USER tentando adicionar em empresa SEM permissão

**Preparação:**
1. Login com usuário USER vinculado à Empresa A (ID 1)
2. Tentar adicionar lead na Empresa B (ID 2)

**Método:** `POST`  
**URL:** `http://localhost:3000/api/leads/manual`  
**Body:**
```json
{
  "nome": "Teste Hack",
  "email": "hack@email.com",
  "empresa_id": "2"
}
```

**Resposta Esperada (403):**
```json
{
  "success": false,
  "message": "Você não tem permissão para adicionar leads nesta empresa"
}
```

---

## 🌐 Testes com Ngrok (Apps Script)

Se estiver testando integração com Google Sheets:

1. Iniciar Ngrok:
```bash
ngrok http 3000
```

2. Copiar URL: `https://abc123.ngrok.io`

3. Substituir URL no Postman:
```
https://abc123.ngrok.io/api/leads
```

4. Testar normalmente

---

## 📊 Verificar Leads no Banco

Após enviar leads, verificar no banco de dados:

```sql
-- Ver todos os leads
SELECT 
  id, 
  nome, 
  email, 
  telefone, 
  stage, 
  dados_originais
FROM leads
ORDER BY data_entrada DESC;

-- Ver leads de uma empresa específica
SELECT * FROM leads 
WHERE dados_originais->>'empresa_id' = '1';

-- Contar leads por empresa
SELECT 
  dados_originais->>'empresa_id' as empresa_id,
  dados_originais->>'empresa' as empresa,
  COUNT(*) as total
FROM leads
GROUP BY dados_originais->>'empresa_id', dados_originais->>'empresa';
```

---

## 🐛 Troubleshooting

### Erro: "Cannot POST /api/leads"
- ✅ Verificar se servidor está rodando: `node server.js`
- ✅ Verificar URL: `http://localhost:3000/api/leads`

### Erro: "Usuário não autenticado"
- ✅ Fazer login antes (Teste Login acima)
- ✅ Verificar cookie de sessão no Postman

### Erro: "Campo empresa_id é obrigatório"
- ✅ Adicionar `"empresa_id": "1"` no body

### Erro: "Empresa com ID X não encontrada"
- ✅ Verificar se empresa existe: `SELECT * FROM empresas WHERE id = 1;`
- ✅ Criar empresa se necessário

---

## 📝 Exemplos Extras

### Lead com Todos os Campos

```json
{
  "empresa_id": "1",
  "nome": "Exemplo Completo",
  "email": "completo@email.com",
  "telefone": "41999887766",
  "data_contato": "2025-10-27",
  "origem": "Google Sheets",
  "campanha": "Black Friday 2025",
  "interesse": "Produto Premium",
  "observacao": "Cliente VIP - contato urgente",
  "valor": "15000",
  "status_negociacao": "Em andamento",
  "vendedor_responsavel": "João Vendas"
}
```

### Lead Mínimo (Apenas Obrigatórios)

```json
{
  "empresa_id": "1",
  "nome": "Lead Minimo",
  "email": "minimo@email.com"
}
```

---

## ✅ Checklist de Testes

- [ ] Teste 1: Enviar lead com empresa_id → Sucesso 201
- [ ] Teste 2: Enviar lead SEM empresa_id → Erro 400
- [ ] Teste 3: Enviar batch de leads → Sucesso 201
- [ ] Teste 4: Listar leads (ADMIN) → Retorna todos
- [ ] Teste 4b: Listar leads (USER) → Retorna apenas da empresa
- [ ] Teste 5: Adicionar lead manual → Sucesso 201
- [ ] Teste 6: USER adicionar em empresa sem permissão → Erro 403
- [ ] Verificar banco: Leads inseridos corretamente
- [ ] Verificar frontend: Leads aparecem no CRM

---

**Última atualização:** 27 de outubro de 2025  
**Versão:** 2.0
