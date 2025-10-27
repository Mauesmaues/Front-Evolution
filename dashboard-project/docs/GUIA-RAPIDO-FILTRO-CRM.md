# 🚀 Guia Rápido - Filtro de Empresa no CRM

## 📍 Como Usar

### 1️⃣ Abrir o CRM
- Clique no menu lateral em **"CRM"**
- O filtro aparecerá automaticamente logo abaixo do título

### 2️⃣ Filtrar por Empresa

**Se você é ADMIN ou GESTOR:**
```
┌──────────────────────────────┐
│ 🌐 Todas as Empresas       ▼ │ ← Selecione aqui
│ Empresa ABC                  │
│ Empresa XYZ                  │
│ Empresa 123                  │
└──────────────────────────────┘
```

**Se você é USER:**
```
┌──────────────────────────────┐
│ Empresa ABC                ▼ │ ← Só vê suas empresas
│ Empresa XYZ                  │
└──────────────────────────────┘
```

### 3️⃣ Visualizar Resultado
```
🏢 Filtrar por Empresa:
┌────────────────────┐
│ Empresa ABC      ▼ │  📊 15 leads encontrados
└────────────────────┘
       ↑                        ↑
    Empresa             Contador atualiza
   selecionada          automaticamente
```

---

## 🎯 Casos de Uso

### Caso 1: Ver leads de UMA empresa específica
1. Abra o CRM
2. Selecione a empresa no dropdown
3. ✅ Kanban mostra apenas leads dessa empresa

### Caso 2: Ver leads de TODAS as empresas (ADMIN/GESTOR)
1. Abra o CRM
2. Selecione "🌐 Todas as Empresas"
3. ✅ Kanban mostra todos os leads do sistema

### Caso 3: Alternar entre empresas rapidamente
1. Abra o CRM
2. Selecione "Empresa A" → Vê leads da A
3. Selecione "Empresa B" → Vê leads da B
4. ✅ Troca é instantânea (sem recarregar)

---

## ❓ FAQ

### P: Como sei quantos leads tem na empresa?
**R:** O número aparece ao lado do filtro: "X leads encontrados"

### P: Posso ver leads de várias empresas ao mesmo tempo?
**R:** Sim, se for ADMIN/GESTOR, selecione "🌐 Todas as Empresas"

### P: Por que não vejo a opção "Todas as Empresas"?
**R:** Você é usuário USER. Só ADMIN e GESTOR veem essa opção.

### P: Por que só vejo algumas empresas no filtro?
**R:** Você só tem permissão para ver empresas vinculadas ao seu usuário.

### P: O filtro funciona com drag & drop?
**R:** Sim! Pode arrastar leads entre colunas normalmente.

### P: O que acontece se eu tiver apenas 1 empresa?
**R:** Ela já vem selecionada automaticamente.

---

## 🔍 Exemplo Visual

**ANTES (sem filtro):**
```
CRM - Funil de Vendas

Entrou (50) │ Agendou (30) │ Analisando (20) │ Fechou (10)
Empresas: ABC, XYZ, 123 misturadas
```

**DEPOIS (filtro "Empresa ABC"):**
```
CRM - Funil de Vendas

🏢 Filtro: [Empresa ABC ▼]  📊 35 leads encontrados

Entrou (15) │ Agendou (10) │ Analisando (8) │ Fechou (2)
Apenas leads da Empresa ABC
```

---

## ⚡ Dicas de Uso

### ✅ Dica 1: Use para relatórios
Selecione empresa → Conta quantos leads em cada etapa

### ✅ Dica 2: Foco no trabalho
Se gerencia várias empresas, filtre uma por vez para não se perder

### ✅ Dica 3: Performance
Filtro é local (não consulta servidor). Troca rápida entre empresas!

---

## 🐛 Solução de Problemas

### Problema: Filtro aparece vazio
**Solução:** Você não tem empresas vinculadas. Contate o ADMIN.

### Problema: Leads não aparecem ao filtrar
**Solução:** Verifique se os leads foram cadastrados com a empresa correta.

### Problema: Contador mostra 0 leads
**Solução:** A empresa selecionada não tem leads cadastrados ainda.

---

## 📞 Suporte

Se tiver problemas:
1. Recarregue a página (F5)
2. Faça logout e login novamente
3. Contate o administrador do sistema

---

**Pronto! Agora você sabe usar o filtro de empresas no CRM! 🎉**
