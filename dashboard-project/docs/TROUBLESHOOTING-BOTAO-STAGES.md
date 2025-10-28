# 🐛 TROUBLESHOOTING - Botão "Gerenciar Etapas" Não Funciona

## 🔍 Diagnóstico

Execute estes testes no **Console do Navegador (F12)**:

---

### ✅ Teste 1: Verificar se o módulo está carregado
```javascript
// Abra o console (F12) e cole:
console.log('Teste 1:', typeof window.abrirModalStages);
```

**Resultado esperado:** `"function"`

**Se retornar `"undefined"`:**
- ❌ Arquivo `stageManager.js` não está carregado
- ❌ Erro de sintaxe no arquivo
- ✅ **Solução:** Limpe cache (Ctrl+F5) e recarregue

---

### ✅ Teste 2: Verificar se Bootstrap está disponível
```javascript
// No console:
console.log('Teste 2:', typeof bootstrap);
console.log('Modal:', typeof bootstrap.Modal);
```

**Resultado esperado:** 
- `bootstrap`: `"object"`
- `Modal`: `"function"`

**Se retornar `"undefined"`:**
- ❌ Bootstrap 5 não está carregado
- ✅ **Solução:** Verifique conexão com internet (CDN do Bootstrap)

---

### ✅ Teste 3: Verificar se o botão existe
```javascript
// No console:
const btn = document.getElementById('btnGerenciarStages');
console.log('Teste 3:', btn);
console.log('Visível:', btn ? window.getComputedStyle(btn).display : 'não existe');
```

**Resultado esperado:** Elemento HTML do botão

**Se retornar `null`:**
- ❌ Botão não existe no DOM
- ❌ CRM não foi carregado
- ✅ **Solução:** Clique no menu "CRM" primeiro

---

### ✅ Teste 4: Verificar se o modal existe
```javascript
// No console:
const modal = document.getElementById('modalGerenciarStages');
console.log('Teste 4:', modal);
```

**Resultado esperado:** Elemento HTML do modal

**Se retornar `null`:**
- ❌ Modal não existe no HTML
- ❌ Arquivo index.html não foi atualizado
- ✅ **Solução:** Verifique se o modal foi adicionado ao HTML

---

### ✅ Teste 5: Chamar função manualmente
```javascript
// No console:
window.abrirModalStages();
```

**Resultado esperado:** Modal abre OU mensagem de erro clara

**Possíveis erros:**
1. `"Erro ao identificar empresa"` → Nenhuma empresa selecionada
2. `"Modal não encontrado"` → Modal não existe no DOM
3. Erro 404 na API → Backend não está rodando
4. Erro 500 na API → Tabela `empresa_stages` não existe

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "abrirModalStages is not defined"
**Causa:** Arquivo `stageManager.js` não carregou

**Soluções:**
1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Recarregue página (Ctrl+F5)
3. Verifique console por erros de sintaxe
4. Verifique se arquivo existe: `public/js/stageManager.js`

**Verificação:**
```javascript
// No console:
console.log('Scripts carregados:', 
  Array.from(document.scripts).map(s => s.src)
);
// Procure por 'stageManager.js' na lista
```

---

### Problema 2: "bootstrap is not defined"
**Causa:** Bootstrap 5 não está carregado

**Soluções:**
1. Verifique conexão com internet
2. Verifique se CDN do Bootstrap está no HTML:
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

---

### Problema 3: Botão clica mas nada acontece
**Causa:** Erro silencioso na função

**Solução:**
1. Abra console (F12) → Aba "Console"
2. Clique no botão
3. Procure por mensagens de erro em vermelho
4. Se aparecer erro, copie e envie para análise

**Verificação manual:**
```javascript
// No console, execute passo a passo:

// 1. Verificar empresa
const empresaId = localStorage.getItem('empresaSelecionada');
console.log('Empresa:', empresaId);

// 2. Tentar buscar stages
fetch(`/api/stages/1`)
  .then(r => r.json())
  .then(d => console.log('Stages:', d))
  .catch(e => console.error('Erro:', e));

// 3. Verificar modal
const modal = document.getElementById('modalGerenciarStages');
console.log('Modal existe:', !!modal);

// 4. Tentar abrir modal
if (modal && typeof bootstrap !== 'undefined') {
  new bootstrap.Modal(modal).show();
  console.log('Modal aberto manualmente!');
}
```

---

### Problema 4: "Erro ao identificar empresa"
**Causa:** Nenhuma empresa selecionada no filtro

**Soluções:**
1. Selecione uma empresa no filtro do CRM
2. OU crie uma empresa primeiro (menu Empresas)
3. OU o usuário não tem empresas vinculadas

**Verificação:**
```javascript
// No console:
fetch('/api/session-user')
  .then(r => r.json())
  .then(d => console.log('Usuário:', d));

fetch('/api/buscarEmpresas')
  .then(r => r.json())
  .then(d => console.log('Empresas:', d));
```

---

### Problema 5: Erro 404 ao buscar stages
**Causa:** Rota não existe ou servidor não está rodando

**Soluções:**
1. Verifique se servidor está rodando: `npm start`
2. Verifique se rota foi adicionada em `backend/routes/api.js`
3. Reinicie o servidor

**Verificação:**
```javascript
// No console:
fetch('/api/stages/1')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Erro de conexão:', e));
```

---

### Problema 6: Erro 500 ao buscar stages
**Causa:** Tabela `empresa_stages` não existe

**Soluções:**
1. Execute o script SQL: `docs/empresa-stages-database.sql`
2. Verifique logs do servidor no terminal
3. Verifique se Supabase está configurado

**Verificação no Supabase:**
```sql
-- No SQL Editor:
SELECT * FROM information_schema.tables 
WHERE table_name = 'empresa_stages';
```

---

## 🔧 Teste Completo do Sistema

Execute este script completo no console:

```javascript
// ========================================
// TESTE COMPLETO - SISTEMA DE STAGES
// ========================================

console.log('🧪 Iniciando teste completo...\n');

// 1. Módulos carregados
console.log('1️⃣ Módulos:');
console.log('  - stageManager:', typeof window.abrirModalStages);
console.log('  - Bootstrap:', typeof bootstrap);
console.log('  - Bootstrap.Modal:', typeof bootstrap?.Modal);

// 2. Elementos DOM
console.log('\n2️⃣ Elementos DOM:');
const btn = document.getElementById('btnGerenciarStages');
const modal = document.getElementById('modalGerenciarStages');
console.log('  - Botão existe:', !!btn);
console.log('  - Botão visível:', btn ? window.getComputedStyle(btn).display !== 'none' : false);
console.log('  - Modal existe:', !!modal);

// 3. Empresa selecionada
console.log('\n3️⃣ Empresa:');
const empresaSelecionada = localStorage.getItem('empresaSelecionada');
console.log('  - localStorage:', empresaSelecionada);

// 4. API - Session
console.log('\n4️⃣ Testando API - Session:');
fetch('/api/session-user')
  .then(r => r.json())
  .then(d => {
    console.log('  - Usuário:', d.success ? d.data.nome : 'Erro');
    console.log('  - Permissão:', d.success ? d.data.permissao : 'N/A');
    console.log('  - Empresas:', d.success ? d.data.empresas?.length : 0);
  })
  .catch(e => console.error('  - Erro:', e.message));

// 5. API - Stages
console.log('\n5️⃣ Testando API - Stages:');
setTimeout(() => {
  fetch('/api/stages/1')
    .then(r => {
      console.log('  - Status:', r.status, r.statusText);
      return r.json();
    })
    .then(d => {
      console.log('  - Sucesso:', d.success);
      console.log('  - Stages:', d.data?.estagios?.length || 0);
    })
    .catch(e => console.error('  - Erro:', e.message));
}, 1000);

// 6. Tentar abrir modal
console.log('\n6️⃣ Tentando abrir modal...');
setTimeout(() => {
  try {
    if (typeof window.abrirModalStages === 'function') {
      window.abrirModalStages();
      console.log('  ✅ Função chamada com sucesso!');
    } else {
      console.error('  ❌ Função não disponível');
    }
  } catch (error) {
    console.error('  ❌ Erro:', error.message);
  }
}, 2000);

console.log('\n✅ Teste completo agendado. Aguarde 3 segundos...');
```

---

## 📋 Checklist de Verificação

Execute e marque cada item:

- [ ] Arquivo `public/js/stageManager.js` existe
- [ ] Arquivo `public/css/stageManager.css` existe
- [ ] Script está importado no `index.html`
- [ ] CSS está importado no `index.html`
- [ ] Modal HTML está no `index.html`
- [ ] Bootstrap 5 está carregado
- [ ] Servidor backend está rodando
- [ ] Tabela `empresa_stages` existe
- [ ] Rota `/api/stages/:empresaId` existe
- [ ] Cache do navegador foi limpo
- [ ] Console não mostra erros
- [ ] Botão está visível no CRM
- [ ] Usuário tem empresas vinculadas

---

## 🆘 Se Nada Funcionar

1. **Reinicie tudo:**
```bash
# Terminal 1 - Backend
Ctrl+C (parar servidor)
npm start

# Navegador
Ctrl+Shift+Delete (limpar cache)
Ctrl+F5 (recarregar)
F12 (abrir console)
```

2. **Execute o teste completo** (script acima)

3. **Copie os resultados do console** e envie para análise

4. **Verifique logs do servidor** no terminal

---

## 📞 Informações para Suporte

Se precisar pedir ajuda, forneça:

1. **Resultado do teste completo** (console)
2. **Screenshot do erro** (se houver)
3. **Logs do servidor** (terminal)
4. **Navegador e versão** (Ex: Chrome 120)
5. **Sistema operacional** (Windows/Linux/Mac)

---

**Boa sorte! 🚀**
