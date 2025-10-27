# ✅ Checklist de Implementação - CRM com Permissionamento

## 📋 Antes de Começar

- [ ] Fazer backup completo do banco de dados
- [ ] Ter acesso ao Supabase/PostgreSQL
- [ ] Ter Node.js instalado e servidor rodando
- [ ] Ter acesso ao código-fonte (backend e frontend)

---

## 🗄️ Banco de Dados

### Criar Tabela
- [ ] Executar `docs/leads-table-setup.sql` no Supabase
- [ ] Verificar criação: `SELECT * FROM leads LIMIT 5;`
- [ ] Verificar índices: `SELECT * FROM pg_indexes WHERE tablename = 'leads';`

### Verificar Estrutura
- [ ] Tabela tem coluna `dados_originais` do tipo JSONB
- [ ] Índice GIN foi criado: `idx_leads_dados_originais_gin`
- [ ] Índice empresa_id foi criado: `idx_leads_empresa_id`

### Dados de Teste
- [ ] Inserir 3 leads de exemplo (já inclusos no SQL)
- [ ] Verificar: `SELECT id, nome, email, dados_originais->>'empresa_id' as empresa_id FROM leads;`

---

## 🔧 Backend

### Arquivos Modificados
- [ ] `backend/controllers/CrmController.js` - 4 métodos atualizados
- [ ] `backend/routes/api.js` - 2 novas rotas adicionadas

### Verificar Código
- [ ] `CrmController.receberLeadExterno()` valida `empresa_id`
- [ ] `CrmController.listarLeads()` filtra por empresa
- [ ] `CrmController.adicionarLeadManual()` valida permissões
- [ ] Rotas `GET /api/leads` e `POST /api/leads/manual` existem em `api.js`

### Reiniciar Servidor
- [ ] Parar servidor (Ctrl+C)
- [ ] Rodar novamente: `node server.js`
- [ ] Verificar logs: "✅ Servidor rodando na porta 3000"

---

## 🎨 Frontend

### Arquivo crm.js
- [ ] Função `carregarLeadsCRM()` atualizada (busca de `/api/leads`)
- [ ] Função `processarLeadDoBanco(lead)` criada
- [ ] Função `criarCardLead()` aceita parâmetro `stageSalva`

### Modal de Adicionar Lead
- [ ] Copiar HTML do modal de `docs/codigo-modal-adicionar-lead.html`
- [ ] Adicionar após `modalCriarProposta` em `public/index.html`
- [ ] ID do modal: `modalAdicionarLead`

### Funções JavaScript
- [ ] Copiar funções de `docs/codigo-modal-adicionar-lead.html`
- [ ] Adicionar no final de `public/js/crm.js`
- [ ] Funções criadas: `abrirModalAdicionarLead()`, `salvarLeadManual()`

### Event Listeners
- [ ] Event listener para `#addLeadBtn` adicionado
- [ ] Event listener para `#btnSalvarLead` adicionado

---

## 🧪 Testes - Parte 1: Backend

### Teste 1: Receber Lead Externo (POST /api/leads)
```bash
# Testar com curl ou Postman
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": "1",
    "nome": "Teste API",
    "email": "teste@email.com",
    "telefone": "41999999999",
    "origem": "Teste Manual"
  }'
```

**Resultado Esperado:**
- [ ] Status 201
- [ ] Resposta JSON com `success: true`
- [ ] Lead inserido no banco

### Teste 2: Listar Leads (GET /api/leads)

**Com usuário ADMIN:**
- [ ] Login com ADMIN
- [ ] Fazer requisição: `GET http://localhost:3000/api/leads`
- [ ] Verificar: Retorna TODOS os leads de TODAS as empresas

**Com usuário USER:**
- [ ] Criar usuário USER vinculado à Empresa A
- [ ] Login com USER
- [ ] Fazer requisição: `GET http://localhost:3000/api/leads`
- [ ] Verificar: Retorna APENAS leads da Empresa A

### Teste 3: Validação de empresa_id
```bash
# Enviar lead SEM empresa_id (deve dar erro)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Erro",
    "email": "erro@email.com"
  }'
```

**Resultado Esperado:**
- [ ] Status 400
- [ ] Mensagem de erro: "Campo empresa_id é obrigatório"

---

## 🧪 Testes - Parte 2: Frontend

### Teste 4: Carregar Leads no CRM
- [ ] Abrir navegador em `http://localhost:3000`
- [ ] Fazer login (qualquer usuário)
- [ ] Clicar na aba **CRM**
- [ ] Verificar: Leads aparecem automaticamente
- [ ] Verificar: Console do navegador sem erros (F12)

### Teste 5: Adicionar Lead Manual
- [ ] Na aba CRM, clicar em **"Adicionar Lead"**
- [ ] Modal abre com formulário
- [ ] Selecionar empresa está carregado
- [ ] Preencher: Nome, Email, Telefone, Empresa
- [ ] Clicar em **"Adicionar Lead"**
- [ ] Verificar: Lead aparece na coluna "Entrou!"
- [ ] Verificar: Lead foi salvo no banco

### Teste 6: Permissionamento no Frontend

**Preparação:**
- [ ] Criar Empresa A (ID 1)
- [ ] Criar Empresa B (ID 2)
- [ ] Criar usuário USER vinculado APENAS à Empresa A
- [ ] Adicionar 1 lead na Empresa A
- [ ] Adicionar 1 lead na Empresa B

**Teste:**
- [ ] Login com usuário USER
- [ ] Ir para aba CRM
- [ ] Verificar: Aparece APENAS o lead da Empresa A
- [ ] Verificar: Lead da Empresa B NÃO aparece

### Teste 7: Tentativa de Adicionar Lead em Empresa Sem Permissão

**Com usuário USER (vinculado à Empresa A):**
- [ ] Clicar em "Adicionar Lead"
- [ ] Verificar: Select de empresa mostra APENAS Empresa A
- [ ] Tentar adicionar lead na Empresa B via console:
  ```javascript
  fetch('/api/leads/manual', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      nome: "Teste Hack",
      email: "hack@email.com",
      empresa_id: "2" // Empresa que USER NÃO tem acesso
    })
  })
  ```
- [ ] Verificar: Retorna erro 403 "Você não tem permissão"

---

## 🧪 Testes - Parte 3: Google Sheets (Opcional)

### Teste 8: Apps Script

**Preparação:**
- [ ] Copiar código de `docs/google-sheets-apps-script.js`
- [ ] Colar no Apps Script do Google Sheets
- [ ] Configurar `CONFIG.urlBackend` (usar Ngrok para testes locais)
- [ ] Configurar `CONFIG.empresaId` (ID da empresa no banco)

**Estrutura da Planilha:**
```
| Nome         | Email           | Telefone     | Campanha     | Interesse |
|--------------|-----------------|--------------|--------------|-----------|
| João Silva   | joao@email.com  | 41999999999  | Facebook Ads | Produto X |
| Maria Santos | maria@email.com | 41988888888  | Google Ads   | Serviço Y |
```

**Teste:**
- [ ] No menu "🚀 CRM", clicar em "🧪 Testar Envio (1 Lead)"
- [ ] Verificar: Mensagem de sucesso aparece
- [ ] Verificar: Lead aparece no banco de dados
- [ ] Verificar: Lead aparece no frontend (recarregar aba CRM)

### Teste 9: Envio em Massa
- [ ] Adicionar 5-10 leads na planilha
- [ ] Clicar em "📤 Enviar Leads"
- [ ] Confirmar ação
- [ ] Verificar: Mensagem mostra "✅ Enviados: X"
- [ ] Verificar: Todos os leads aparecem no banco
- [ ] Verificar: Todos os leads aparecem no frontend

---

## 🔍 Verificações Finais

### Banco de Dados
- [ ] Tabela `leads` tem leads de teste
- [ ] Campo `dados_originais` está populado com JSONB
- [ ] Todos os leads têm `dados_originais->>'empresa_id'`
- [ ] Índices estão criados e funcionando

### Backend
- [ ] Servidor rodando sem erros
- [ ] Logs mostram "📥 [CrmController] Lead recebido" quando envia lead
- [ ] Logs mostram "✅ [CrmController] Lead salvo com sucesso"
- [ ] Rota GET /api/leads retorna JSON correto

### Frontend
- [ ] Leads carregam automaticamente ao abrir aba CRM
- [ ] Cards dos leads são exibidos corretamente
- [ ] Modal "Adicionar Lead" abre e fecha sem erros
- [ ] Drag & drop de leads entre colunas funciona
- [ ] Comentários em leads funcionam

### Permissionamento
- [ ] ADMIN vê todos os leads
- [ ] GESTOR vê todos os leads
- [ ] USER vê apenas leads das suas empresas
- [ ] USER não consegue adicionar lead em empresa sem permissão

### Documentação
- [ ] Todos os arquivos de docs foram lidos
- [ ] Scripts do Google Sheets foram copiados
- [ ] Código do modal foi adicionado ao HTML

---

## 📊 Métricas de Sucesso

### Performance
- [ ] Listagem de 100 leads < 2 segundos
- [ ] Inserção de lead < 1 segundo
- [ ] Consultas JSONB usam índices (verificar EXPLAIN)

### Usabilidade
- [ ] Interface intuitiva e responsiva
- [ ] Erros mostram mensagens claras
- [ ] Drag & drop funciona suavemente

### Segurança
- [ ] Permissionamento impede acesso a leads de outras empresas
- [ ] Validações de entrada funcionam
- [ ] empresa_id é obrigatório e validado

---

## 🐛 Troubleshooting Rápido

### Problema: Leads não aparecem no CRM
1. [ ] Verificar console do navegador (F12) → Erros em vermelho
2. [ ] Verificar logs do backend → Procurar por erros
3. [ ] Verificar se há leads no banco: `SELECT COUNT(*) FROM leads;`
4. [ ] Verificar se usuário tem empresas vinculadas: `SELECT * FROM usuario_empresa WHERE usuario_id = X;`

### Problema: Erro ao enviar lead via Apps Script
1. [ ] Verificar URL do backend no CONFIG
2. [ ] Se localhost, usar Ngrok: `ngrok http 3000`
3. [ ] Verificar empresa_id no CONFIG
4. [ ] Ver logs do Apps Script: `View > Logs`

### Problema: Modal não abre
1. [ ] Verificar se ID do modal está correto: `modalAdicionarLead`
2. [ ] Verificar se event listener foi adicionado
3. [ ] Verificar console do navegador para erros

---

## ✅ Conclusão

- [ ] Todos os testes passaram
- [ ] Sistema está funcionando em desenvolvimento
- [ ] Documentação foi lida e compreendida
- [ ] Pronto para deploy em produção

---

**Última verificação:** _________________  
**Responsável:** _________________  
**Status:** 🟢 Aprovado / 🟡 Pendente / 🔴 Com Problemas

---

## 📚 Referências Rápidas

- **Documentação Completa:** `docs/crm-nova-estrutura.md`
- **Guia Passo a Passo:** `docs/IMPLEMENTACAO-PASSO-A-PASSO.md`
- **Resumo Executivo:** `docs/RESUMO-EXECUTIVO.md`
- **Apps Script:** `docs/google-sheets-apps-script.js`
- **Modal HTML/JS:** `docs/codigo-modal-adicionar-lead.html`

---

**Versão:** 2.0  
**Data:** 27 de outubro de 2025
