# 🏢 Filtro de Empresa no CRM - Documentação

## 📋 Visão Geral

O CRM agora possui um **filtro inteligente de empresas** que permite aos usuários visualizar leads de empresas específicas, respeitando o sistema de permissionamento do projeto.

---

## 🎯 Funcionalidades

### ✅ O que foi implementado:

1. **Select de Empresas no Header do CRM**
   - Dropdown elegante com lista de empresas
   - Contador de leads filtrados em tempo real
   - Localização: Logo abaixo do título "CRM - Funil de Vendas"

2. **Permissionamento Automático**
   - **ADMIN/GESTOR:** Vê opção "🌐 Todas as Empresas" + lista completa
   - **USER:** Vê apenas empresas que tem permissão de acesso
   - Seleção automática se usuário tem apenas 1 empresa

3. **Filtro Dinâmico**
   - Filtra leads em tempo real ao mudar seleção
   - Mantém estrutura Kanban (4 colunas)
   - Atualiza contadores de cada coluna
   - Performance otimizada (sem recarregar do servidor)

4. **Feedback Visual**
   - "X leads encontrados" ao lado do filtro
   - Atualização instantânea ao trocar empresa

---

## 🔧 Componentes Implementados

### 1. Frontend (HTML)
**Arquivo:** `public/index.html` (linhas 316-340)

```html
<!-- Filtro de Empresa -->
<div class="d-flex align-items-center gap-3">
    <div class="flex-grow-1" style="max-width: 400px;">
        <label for="filtroEmpresaCRM" class="form-label mb-1">
            <i class="fas fa-building me-1"></i>Filtrar por Empresa:
        </label>
        <select id="filtroEmpresaCRM" class="form-select form-select-sm">
            <option value="">Carregando empresas...</option>
        </select>
    </div>
    <div id="infoLeadsFiltrados" class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        <span id="totalLeadsFiltrados">0</span> leads encontrados
    </div>
</div>
```

### 2. JavaScript (Lógica)
**Arquivo:** `public/js/crm.js`

#### Variáveis Globais Adicionadas:
```javascript
window.empresasDisponiveis = []; // Array de empresas
window.empresaIdFiltroAtual = ''; // ID da empresa filtrada ('' = todas)
```

#### Funções Criadas:

**1. `carregarEmpresasParaFiltro()`**
- Busca empresas do endpoint `/api/buscarEmpresas`
- Já vem filtrado por permissão (backend faz isso)
- Popula o select automaticamente

**2. `popularSelectEmpresas(empresas)`**
- Cria opções no select
- Adiciona "Todas as Empresas" para ADMIN/GESTOR
- Seleciona automaticamente se tem apenas 1 empresa

**3. `filtrarLeadsPorEmpresa(empresaId)`**
- Filtra array `window.leadsGlobais` por empresa_id
- Limpa e reconstrói Kanban com leads filtrados
- Atualiza contadores

**4. `atualizarInfoLeadsFiltrados()`**
- Conta cards visíveis no Kanban
- Atualiza elemento `#totalLeadsFiltrados`

### 3. Backend (Rota Existente)
**Arquivo:** `backend/routes/api.js` (linha 20)

```javascript
router.get('/buscarEmpresas', EmpresaController.buscarEmpresas);
```

**Permissionamento já implementado:**
- ADMIN/GESTOR: Retorna todas as empresas
- USER: Retorna apenas empresas vinculadas (`usuario_empresa`)

---

## 🚀 Fluxo de Funcionamento

### 1. Usuário Clica no Menu CRM
```
[Clique no menu CRM]
    ↓
[carregarEmpresasParaFiltro()] → Busca empresas do backend
    ↓
[popularSelectEmpresas()] → Preenche dropdown
    ↓
[carregarLeadsCRM()] → Busca todos os leads
    ↓
[processarLeadDoBanco()] → Armazena empresa_id de cada lead
    ↓
[atualizarInfoLeadsFiltrados()] → Mostra "X leads encontrados"
```

### 2. Usuário Muda o Filtro
```
[Change event no select]
    ↓
[filtrarLeadsPorEmpresa(empresaId)]
    ↓
[Limpa Kanban] → limparColunasEContadores()
    ↓
[Filtra leadsGlobais] → .filter(lead => lead.empresa_id === empresaId)
    ↓
[Reconstrói Kanban] → criarCardLead() para cada lead filtrado
    ↓
[Atualiza Contadores] → atualizarContadoresColunas()
    ↓
[Atualiza Info] → "X leads encontrados"
```

---

## 📊 Estrutura de Dados

### Lead armazenado em `window.leadsGlobais`:
```javascript
{
  lead: {
    id: 123,
    nome: "João Silva",
    email: "joao@email.com",
    telefone: "41999887766",
    empresa_id: "1", // ⭐ Campo usado no filtro
    empresa: "Empresa ABC",
    origem: "Google Sheets",
    dados_originais: {
      empresa_id: "1",
      empresa: "Empresa ABC",
      campanha: "Facebook Ads"
      // ... outros campos JSONB
    }
  },
  stageSalva: "entrou"
}
```

### Empresas em `window.empresasDisponiveis`:
```javascript
[
  { id: 1, nome: "Empresa ABC", conta_de_anuncio: "act_123" },
  { id: 2, nome: "Empresa XYZ", conta_de_anuncio: "act_456" }
]
```

---

## 🔐 Permissionamento

### Cenário 1: ADMIN
```
Select mostra:
- 🌐 Todas as Empresas (value="")
- Empresa ABC (value="1")
- Empresa XYZ (value="2")
- Empresa 123 (value="3")

Comportamento:
- "Todas": Mostra TODOS os leads do sistema
- Seleção específica: Filtra apenas aquela empresa
```

### Cenário 2: GESTOR
```
Select mostra:
- 🌐 Todas as Empresas (value="")
- Empresa ABC (value="1")
- Empresa XYZ (value="2")
- Empresa 123 (value="3")

Comportamento: Idêntico ao ADMIN
```

### Cenário 3: USER (vinculado a Empresas 1 e 2)
```
Select mostra:
- Empresa ABC (value="1")
- Empresa XYZ (value="2")

Comportamento:
- NÃO tem opção "Todas as Empresas"
- Só vê empresas vinculadas
- Se tem apenas 1 empresa, já vem selecionada
```

---

## 🎨 Estilos CSS

### Classes Bootstrap Usadas:
- `form-select` - Select do Bootstrap 5
- `form-select-sm` - Tamanho pequeno
- `form-label` - Label estilizado
- `text-muted` - Cor cinza para info
- `d-flex` - Display flex
- `align-items-center` - Alinhamento vertical
- `gap-3` - Espaçamento entre elementos

### Estilos Inline:
```css
max-width: 400px; /* Select não fica muito largo */
font-size: 0.9rem; /* Label menor */
font-weight: 500; /* Label semi-bold */
margin-top: 28px; /* Alinha info com select */
```

---

## 🧪 Como Testar

### Teste 1: ADMIN vendo todas as empresas
```
1. Faça login como ADMIN
2. Clique no menu "CRM"
3. Verifique se select mostra "🌐 Todas as Empresas"
4. Verifique se todas as empresas estão listadas
5. Mude para empresa específica → deve filtrar
6. Volte para "Todas" → deve mostrar todos os leads
```

### Teste 2: USER com múltiplas empresas
```
1. Faça login como USER com empresas 1 e 2
2. Clique no menu "CRM"
3. Verifique se select NÃO tem opção "Todas"
4. Verifique se só mostra empresas 1 e 2
5. Mude entre empresas → deve filtrar corretamente
```

### Teste 3: USER com apenas 1 empresa
```
1. Faça login como USER com apenas empresa 1
2. Clique no menu "CRM"
3. Verifique se empresa já vem selecionada automaticamente
4. Verifique se só mostra leads da empresa 1
```

### Teste 4: Contador de leads
```
1. Abra CRM
2. Verifique "X leads encontrados" ao lado do filtro
3. Mude o filtro → contador deve atualizar instantaneamente
4. Arraste lead entre colunas → contador não muda (só filtra)
```

---

## 🐛 Troubleshooting

### Problema: Select aparece vazio
**Causa:** Backend não retornou empresas ou usuário sem permissão  
**Solução:** 
```javascript
// Verificar no console do navegador:
console.log(window.empresasDisponiveis);

// Se vazio, verificar no backend se usuário tem empresas vinculadas
SELECT * FROM usuario_empresa WHERE usuario_id = X;
```

### Problema: Filtro não funciona
**Causa:** empresa_id não foi salvo nos leads  
**Solução:**
```javascript
// Verificar estrutura do lead:
console.log(window.leadsGlobais[0]);

// Deve ter:
{
  lead: {
    empresa_id: "1", // ⭐ Este campo é obrigatório
    dados_originais: {
      empresa_id: "1"
    }
  }
}
```

### Problema: USER vê todas as empresas
**Causa:** Backend não está filtrando corretamente  
**Solução:** Verificar `EmpresaController.buscarEmpresas()`:
```javascript
// Deve ter este código:
if (usuario.permissao === 'USER') {
  const { data: empresasVinculadas } = await supabase
    .from('usuario_empresa')
    .select('empresa_id, empresas(*)')
    .eq('usuario_id', usuario.id);
}
```

### Problema: Contador errado
**Causa:** Cards não estão sendo contados corretamente  
**Solução:**
```javascript
// Forçar atualização:
atualizarInfoLeadsFiltrados();

// Verificar no console:
document.querySelectorAll('.lead-card').length;
```

---

## 📈 Performance

### Otimizações Implementadas:
1. **Cache de Empresas:** Carrega 1x e reutiliza
2. **Filtro Local:** Não recarrega do servidor
3. **Sem Re-render Desnecessário:** Só reconstrói Kanban ao filtrar
4. **Event Delegation:** Event listener único no select

### Métricas Esperadas:
- Carregamento inicial: ~500ms (empresas + leads)
- Troca de filtro: ~50ms (filtro local)
- Memória: +2KB por lead armazenado

---

## 🔄 Integração com Sistema Existente

### Mantém Compatibilidade Com:
✅ Drag & Drop de leads entre colunas  
✅ Pop-up de detalhes do lead  
✅ Adicionar comentários  
✅ Adicionar lead manual  
✅ Permissionamento global do sistema  
✅ Sessão de usuário (req.session.user)  

### NÃO Interfere Em:
✅ Dashboard  
✅ Usuários  
✅ Empresas  
✅ Notificações  
✅ Outras telas do sistema  

---

## 🚀 Próximas Melhorias Possíveis

### 1. Busca por Nome de Lead
```html
<input type="text" id="buscarLeadCRM" placeholder="Buscar por nome, email ou telefone...">
```

### 2. Filtro Múltiplo (Várias Empresas ao Mesmo Tempo)
```html
<select id="filtroEmpresaCRM" multiple>...</select>
```

### 3. Filtro por Origem
```html
<select id="filtroOrigemCRM">
  <option value="">Todas as Origens</option>
  <option value="Google Sheets">Google Sheets</option>
  <option value="Site">Site</option>
</select>
```

### 4. Filtro por Data
```html
<input type="date" id="dataInicioCRM">
<input type="date" id="dataFimCRM">
```

### 5. Salvar Filtro no LocalStorage
```javascript
localStorage.setItem('filtroEmpresaCRM', empresaId);
```

---

## 📝 Checklist de Implementação

- [x] Select de empresas no HTML
- [x] Estilo responsivo e alinhamento
- [x] Função `carregarEmpresasParaFiltro()`
- [x] Função `popularSelectEmpresas()`
- [x] Função `filtrarLeadsPorEmpresa()`
- [x] Função `atualizarInfoLeadsFiltrados()`
- [x] Event listener no select
- [x] Integração com carregamento do CRM
- [x] empresa_id no processamento de leads
- [x] Armazenar estrutura correta em leadsGlobais
- [x] Seleção automática para USER com 1 empresa
- [x] Opção "Todas as Empresas" para ADMIN/GESTOR
- [x] Contador de leads filtrados
- [x] Documentação completa

---

## 📖 Referências de Código

### Arquivos Modificados:
1. `public/index.html` (linhas 316-340) - HTML do filtro
2. `public/js/crm.js` (linhas 1-150) - Lógica de filtro

### Arquivos Utilizados (Não Modificados):
1. `backend/routes/api.js` - Rota `/buscarEmpresas`
2. `backend/controllers/EmpresaController.js` - Lógica de permissionamento

---

**Implementado em:** 27 de outubro de 2025  
**Compatível com:** Sistema de permissionamento existente (ADMIN/GESTOR/USER)  
**Status:** ✅ Produção Ready
