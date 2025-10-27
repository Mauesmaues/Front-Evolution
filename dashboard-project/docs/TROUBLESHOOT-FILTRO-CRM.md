# 🔧 Troubleshooting - Filtro de Empresa CRM

## ❌ Problema: Select mostra "Carregando empresas..."

### 🔍 Como Diagnosticar

Abra o **Console do Navegador** (F12) e procure pelos logs:

```
🏢 [CRM] Carregando empresas para filtro...
📡 [CRM] Response status: XXX
📡 [CRM] Response ok: true/false
📦 [CRM] Resultado completo: {...}
✅ [CRM] X empresas armazenadas em window.empresasCRM
🎨 [CRM] Iniciando popularSelectEmpresas...
✅ [CRM] Select encontrado: <select>
📋 [CRM] Populando select com X empresas
👤 [CRM] Usuário obtido: {...}
```

---

## 🐛 Possíveis Causas e Soluções

### 1️⃣ Função não está sendo chamada

**Sintoma:**
```
NÃO aparece: "🏢 [CRM] Carregando empresas para filtro..."
```

**Causa:** `carregarEmpresasParaFiltro()` não foi executada

**Solução:** Verificar o event listener do menu CRM:
```javascript
// Deve estar em crm.js:
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'crm') {
        setTimeout(() => {
            const crmSection = document.getElementById('crmSection');
            if (crmSection && getComputedStyle(crmSection).display !== 'none') {
                carregarEmpresasParaFiltro().then(() => {  // ⭐ Esta linha
                    carregarLeadsCRM();
                });
            }
        }, 100);
    }
});
```

---

### 2️⃣ Erro 401 - Não Autenticado

**Sintoma:**
```
📡 [CRM] Response status: 401
❌ [CRM] Não autenticado, redirecionando...
```

**Causa:** Usuário não está logado

**Solução:**
1. Faça login no sistema
2. Tente novamente

---

### 3️⃣ API não retorna dados

**Sintoma:**
```
📡 [CRM] Response status: 200
📡 [CRM] Response ok: true
📦 [CRM] Resultado completo: { success: false, message: "..." }
OU
📦 [CRM] Resultado completo: { success: true, data: [] }
```

**Causa:** Usuário não tem empresas vinculadas

**Solução SQL:**
```sql
-- Verificar empresas do usuário
SELECT u.id, u.nome, u.permissao, 
       e.id as empresa_id, e.nome as empresa_nome
FROM usuario u
LEFT JOIN usuario_empresa ue ON u.id = ue.usuario_id
LEFT JOIN empresas e ON ue.empresa_id = e.id
WHERE u.id = SEU_USUARIO_ID;

-- Se retornar vazio, vincular empresa ao usuário:
INSERT INTO usuario_empresa (usuario_id, empresa_id)
VALUES (SEU_USUARIO_ID, ID_DA_EMPRESA);
```

---

### 4️⃣ Select não encontrado no DOM

**Sintoma:**
```
🎨 [CRM] Iniciando popularSelectEmpresas...
❌ [CRM] Select #filtroEmpresaCRM não encontrado no DOM
🔍 [CRM] Elementos com "filtro" no ID: [...]
```

**Causa:** HTML do select não existe ou ID está errado

**Solução:** Verificar se existe em `index.html`:
```html
<!-- Deve existir esta linha: -->
<select id="filtroEmpresaCRM" class="form-select form-select-sm">
```

**Como verificar:**
1. Abra DevTools (F12)
2. Aba "Elements"
3. Pressione Ctrl+F
4. Busque por: `filtroEmpresaCRM`
5. Se não encontrar, o HTML não foi adicionado

---

### 5️⃣ window.empresasCRM está vazio

**Sintoma:**
```
✅ [CRM] 0 empresas armazenadas em window.empresasCRM
OU
⚠️ [CRM] window.empresasCRM está vazio ou undefined
📊 [CRM] window.empresasCRM: []
```

**Causa:** Backend retornou array vazio

**Solução:**
1. Verificar permissões do usuário (ver Solução 3)
2. Verificar se há empresas cadastradas:
```sql
SELECT * FROM empresas;
```

---

### 6️⃣ Erro ao obter usuário

**Sintoma:**
```
✅ [CRM] Select encontrado
📋 [CRM] Populando select com X empresas
❌ [CRM] Erro ao obter usuário: {...}
```

**Causa:** Função `obterUsuarioSessao()` falhou

**Solução:**
1. Verificar se `/api/session-user` está funcionando:
```javascript
// No console do navegador:
fetch('/api/session-user').then(r => r.json()).then(console.log)
```

2. Se der erro 401, faça login novamente

---

### 7️⃣ Select está oculto ou em elemento não visível

**Sintoma:**
```
✅ [CRM] Select populado com X empresas
MAS o select não aparece na tela
```

**Causa:** Elemento pai está com `display: none`

**Solução:** Verificar CSS:
```javascript
// No console do navegador:
const select = document.getElementById('filtroEmpresaCRM');
console.log('Display:', getComputedStyle(select).display);
console.log('Visibility:', getComputedStyle(select).visibility);
console.log('Pai display:', getComputedStyle(select.parentElement).display);
```

---

## ✅ Teste Manual Completo

Execute no **Console do Navegador** (F12):

```javascript
// 1. Verificar se select existe
document.getElementById('filtroEmpresaCRM');
// Deve retornar: <select id="filtroEmpresaCRM">

// 2. Verificar window.empresasCRM
console.log(window.empresasCRM);
// Deve retornar: Array com empresas

// 3. Forçar carregamento
carregarEmpresasParaFiltro();
// Aguarde e veja os logs

// 4. Verificar opções do select
const select = document.getElementById('filtroEmpresaCRM');
console.log('Opções:', select.options.length);
Array.from(select.options).forEach(opt => console.log(opt.textContent));

// 5. Testar se API funciona
fetch('/api/buscarEmpresas')
  .then(r => r.json())
  .then(console.log);
```

---

## 📝 Checklist de Verificação

- [ ] Select `#filtroEmpresaCRM` existe no HTML?
- [ ] Usuário está logado?
- [ ] `/api/buscarEmpresas` retorna dados?
- [ ] Usuário tem empresas vinculadas?
- [ ] `window.empresasCRM` está populado?
- [ ] Função `carregarEmpresasParaFiltro()` é chamada?
- [ ] Função `popularSelectEmpresas()` é executada?
- [ ] Event listener do menu CRM está funcionando?
- [ ] Console não mostra erros JavaScript?

---

## 🔄 Solução Rápida

Se nada funcionar, tente esta solução completa:

1. **Logout e Login:**
```
Sair do sistema → Fazer login novamente
```

2. **Limpar Cache:**
```
Ctrl + Shift + R (hard refresh)
```

3. **Verificar Empresas no Banco:**
```sql
-- Ver suas empresas
SELECT e.* 
FROM empresas e
JOIN usuario_empresa ue ON e.id = ue.empresa_id
WHERE ue.usuario_id = SEU_ID;
```

4. **Testar API Diretamente:**
```
Abrir: http://localhost:3000/api/buscarEmpresas
```

5. **Recarregar CRM:**
```
Clique em outro menu → Volte para CRM
```

---

## 📞 Ainda com Problema?

Execute este script de diagnóstico completo:

```javascript
console.log('=== DIAGNÓSTICO CRM ===');
console.log('1. Select existe?', !!document.getElementById('filtroEmpresaCRM'));
console.log('2. window.empresasCRM:', window.empresasCRM);
console.log('3. CRM Section visível?', 
  document.getElementById('crmSection') && 
  getComputedStyle(document.getElementById('crmSection')).display !== 'none'
);

// Testar API
fetch('/api/buscarEmpresas')
  .then(r => {
    console.log('4. API Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('5. API Dados:', data);
  })
  .catch(err => {
    console.error('6. API Erro:', err);
  });

// Testar sessão
fetch('/api/session-user')
  .then(r => r.json())
  .then(data => {
    console.log('7. Usuário:', data);
  })
  .catch(err => {
    console.error('8. Erro sessão:', err);
  });

console.log('=== FIM DIAGNÓSTICO ===');
```

Cole os resultados para análise! 🔍
