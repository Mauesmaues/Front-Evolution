# 🚀 Guia de Implementação - CRM com Permissionamento

## 📋 O Que Foi Feito

### ✅ Arquivos Modificados

1. **`docs/leads-table-setup.sql`** - Estrutura da tabela simplificada
2. **`backend/controllers/CrmController.js`** - 4 métodos atualizados/criados
3. **`backend/routes/api.js`** - 2 novas rotas adicionadas
4. **`public/js/crm.js`** - Nova lógica de carregamento do banco

### 📄 Arquivos de Documentação Criados

1. **`docs/crm-nova-estrutura.md`** - Documentação completa do sistema
2. **`docs/codigo-modal-adicionar-lead.html`** - Modal e JS para adicionar leads
3. **`docs/IMPLEMENTACAO-PASSO-A-PASSO.md`** - Este arquivo

---

## 🔧 Passo a Passo para Implementar

### 1️⃣ Criar/Atualizar Tabela no Banco de Dados

Execute o SQL no Supabase ou PostgreSQL:

```bash
psql -U seu_usuario -d seu_banco -f docs/leads-table-setup.sql
```

Ou copie e cole o conteúdo de `docs/leads-table-setup.sql` no SQL Editor do Supabase.

**Verificar se funcionou:**
```sql
SELECT * FROM leads LIMIT 5;
```

---

### 2️⃣ Adicionar Modal no HTML

Abra `public/index.html` e adicione o modal **APÓS** o `modalCriarProposta` (por volta da linha 1085).

Copie o código do arquivo: **`docs/codigo-modal-adicionar-lead.html`**

---

### 3️⃣ Adicionar Funções JavaScript no crm.js

Abra `public/js/crm.js` e adicione **NO FINAL DO ARQUIVO** (antes da última linha):

```javascript
// Função para abrir modal de adicionar lead
async function abrirModalAdicionarLead() {
  try {
    const response = await fetch('/api/buscarEmpresas');
    const resultado = await response.json();
    
    if (resultado.success && resultado.data) {
      const selectEmpresa = document.getElementById('empresaLeadModal');
      selectEmpresa.innerHTML = '<option value="">Selecione uma empresa...</option>';
      
      resultado.data.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        selectEmpresa.appendChild(option);
      });
      
      const modal = new bootstrap.Modal(document.getElementById('modalAdicionarLead'));
      modal.show();
    }
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    alert('Erro ao carregar empresas. Tente novamente.');
  }
}

// Função para salvar lead manual
async function salvarLeadManual() {
  try {
    const nome = document.getElementById('nomeLeadModal').value.trim();
    const email = document.getElementById('emailLeadModal').value.trim();
    const telefone = document.getElementById('telefoneLeadModal').value.trim();
    const empresaId = document.getElementById('empresaLeadModal').value;
    const observacao = document.getElementById('observacaoLeadModal').value.trim();
    
    if (!nome) {
      alert('Nome é obrigatório');
      return;
    }
    
    if (!email && !telefone) {
      alert('Informe pelo menos email ou telefone');
      return;
    }
    
    if (!empresaId) {
      alert('Selecione uma empresa');
      return;
    }
    
    const dados = {
      nome: nome,
      email: email || null,
      telefone: telefone || null,
      empresa_id: empresaId,
      dados_extras: {
        observacao: observacao || null
      }
    };
    
    const response = await fetch('/api/leads/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    const resultado = await response.json();
    
    if (response.ok && resultado.success) {
      alert('Lead adicionado com sucesso!');
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalAdicionarLead'));
      modal.hide();
      document.getElementById('formAdicionarLead').reset();
      carregarLeadsCRM();
    } else {
      alert('Erro ao adicionar lead: ' + (resultado.message || 'Erro desconhecido'));
    }
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    alert('Erro ao salvar lead. Verifique o console.');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  const btnAdicionarLead = document.getElementById('addLeadBtn');
  if (btnAdicionarLead) {
    btnAdicionarLead.addEventListener('click', abrirModalAdicionarLead);
  }
  
  const btnSalvarLead = document.getElementById('btnSalvarLead');
  if (btnSalvarLead) {
    btnSalvarLead.addEventListener('click', salvarLeadManual);
  }
});

// Expor funções globalmente
window.abrirModalAdicionarLead = abrirModalAdicionarLead;
window.salvarLeadManual = salvarLeadManual;
```

---

### 4️⃣ Atualizar Google Sheets Apps Script

Se você usa Google Sheets, atualize o código para incluir `empresa_id`:

```javascript
function enviarLeadParaCRM() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dados = planilha.getDataRange().getValues();
  
  // Pular cabeçalho
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    
    const lead = {
      empresa_id: "1", // ⭐ IMPORTANTE: Mudar para o ID correto da sua empresa
      nome: linha[0],
      email: linha[1],
      telefone: linha[2],
      origem: "Google Sheets",
      // Adicione outros campos aqui
    };
    
    const url = 'https://sua-url-do-backend.com/api/leads';
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(lead)
    };
    
    try {
      UrlFetchApp.fetch(url, options);
      Logger.log('Lead enviado: ' + lead.nome);
    } catch (error) {
      Logger.log('Erro: ' + error);
    }
  }
}
```

**Como descobrir o ID da sua empresa:**
```sql
SELECT id, nome FROM empresas;
```

---

### 5️⃣ Reiniciar Servidor Backend

```bash
# Se estiver usando nodemon (reinicia automaticamente)
# Não precisa fazer nada

# Se NÃO estiver usando nodemon:
# Parar o servidor (Ctrl+C) e rodar novamente:
cd backend
node server.js
```

---

### 6️⃣ Testar o Sistema

#### Teste 1: Listar Leads (GET)

1. Faça login no sistema
2. Vá para a aba **CRM**
3. Os leads devem carregar automaticamente
4. **ADMIN/GESTOR:** Vê todos os leads
5. **USER:** Vê apenas leads das suas empresas

#### Teste 2: Adicionar Lead Manual

1. Clique no botão **"Adicionar Lead"**
2. Preencha os dados
3. Selecione uma empresa
4. Clique em **"Adicionar Lead"**
5. Lead deve aparecer na coluna "Entrou!"

#### Teste 3: Enviar Lead via API Externa (Google Sheets)

1. Configure o Apps Script (passo 4)
2. Execute a função `enviarLeadParaCRM()`
3. Verifique se o lead apareceu no CRM

---

## 🧪 Verificações de Segurança

### ✅ Checklist de Permissionamento

- [ ] **ADMIN** consegue ver leads de todas as empresas
- [ ] **GESTOR** consegue ver leads de todas as empresas
- [ ] **USER** vê APENAS leads das empresas vinculadas a ele
- [ ] **USER** NÃO consegue adicionar lead em empresa que não tem acesso
- [ ] **USER** NÃO consegue ver lead de empresa que não tem acesso

### Como Testar Permissionamento

1. Crie 2 empresas: **Empresa A** e **Empresa B**
2. Crie 1 usuário USER vinculado apenas à **Empresa A**
3. Adicione 1 lead na **Empresa A** e 1 lead na **Empresa B**
4. Faça login com o usuário USER
5. **Resultado esperado:** USER vê APENAS o lead da Empresa A

---

## 🔍 Troubleshooting

### Problema: Erro "empresa_id é obrigatório"

**Solução:** Todo lead enviado para `/api/leads` DEVE ter `empresa_id` no body.

```javascript
// ❌ ERRADO
const dados = {
  nome: "João Silva",
  email: "joao@email.com"
};

// ✅ CORRETO
const dados = {
  empresa_id: "1", // ⭐ Adicionar isso
  nome: "João Silva",
  email: "joao@email.com"
};
```

### Problema: Leads não aparecem no CRM

1. **Verificar se existem leads no banco:**
   ```sql
   SELECT COUNT(*) FROM leads;
   ```

2. **Verificar se usuário tem empresa vinculada:**
   ```sql
   SELECT * FROM usuario_empresa WHERE usuario_id = 1;
   ```

3. **Verificar logs do backend:**
   ```bash
   # Procurar por erros no terminal onde o servidor está rodando
   ```

4. **Verificar console do navegador:**
   - Abrir DevTools (F12)
   - Ir em Console
   - Procurar erros em vermelho

### Problema: Modal não abre

**Solução:** Verificar se o ID do botão está correto.

```html
<!-- HTML -->
<button id="addLeadBtn" class="btn btn-primary">Adicionar Lead</button>

<!-- JavaScript -->
const btnAdicionarLead = document.getElementById('addLeadBtn');
```

---

## 📊 Estrutura de Dados

### Exemplo de Lead no Banco

```json
{
  "id": 123,
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "41999887766",
  "data_contato": "2025-10-27T10:30:00Z",
  "stage": "entrou",
  "data_entrada": "2025-10-27T10:30:00Z",
  "dados_originais": {
    "empresa_id": "1",
    "empresa": "Empresa ABC",
    "origem": "Google Sheets",
    "campanha": "Facebook Ads",
    "interesse": "Produto X",
    "observacao": "Cliente em potencial"
  },
  "created_at": "2025-10-27T10:30:00Z",
  "updated_at": "2025-10-27T10:30:00Z"
}
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **`docs/crm-nova-estrutura.md`** - Documentação técnica completa
- **`docs/leads-table-setup.sql`** - SQL com comentários e exemplos
- **`docs/ngrok-apps-script.md`** - Como usar Ngrok para testes locais

---

## 🎯 Próximos Passos Recomendados

1. **Deploy em Produção**
   - Subir backend em Render, Railway ou Heroku
   - Atualizar Apps Script com URL de produção

2. **Melhorias Futuras**
   - Editar lead no frontend
   - Exportar leads para CSV/Excel
   - Dashboard de métricas por empresa
   - Integração com WhatsApp Business API

---

## 💬 Suporte

Se tiver dúvidas:

1. Verifique a documentação em `docs/crm-nova-estrutura.md`
2. Veja os logs do backend (terminal)
3. Veja os logs do frontend (Console do navegador - F12)

---

**Última atualização:** 27 de outubro de 2025  
**Versão:** 2.0 - CRM com Permissionamento por Empresa
