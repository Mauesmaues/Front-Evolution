# 🔧 Atualização: Drag & Drop com Persistência no Banco de Dados

## 📋 Problema Identificado

Quando um card (lead) era arrastado para outra etapa no Kanban do CRM, a mudança de stage **não estava sendo salva no banco de dados**. O código apenas salvava a posição no `localStorage`, o que significava que:

- ✅ A mudança aparecia visualmente no navegador
- ❌ Ao recarregar a página, o lead voltava para a etapa original
- ❌ Outros usuários não viam a mudança
- ❌ Não havia rastreamento das mudanças no banco

## 🛠️ Solução Implementada

### 1. **Backend - CrmController.js**

Adicionado novo método `atualizarStage` que:
- ✅ Recebe o ID do lead e o novo stage
- ✅ Valida se o stage é válido (`entrou`, `qualificado`, `conversao`, `ganho`)
- ✅ Verifica permissões do usuário (USER só pode atualizar leads de suas empresas)
- ✅ Atualiza o campo `stage` e `updated_at` no banco de dados
- ✅ Retorna o lead atualizado

```javascript
async atualizarStage(req, res) {
    const { id } = req.params;
    const { stage } = req.body;
    
    // Validações, permissionamento e atualização no banco
    // ...
}
```

### 2. **Backend - Rotas (api.js)**

Adicionada nova rota para atualizar o stage:

```javascript
router.put('/leads/:id/stage', CrmController.atualizarStage);
```

**Endpoint:** `PUT /api/leads/:id/stage`

**Body:**
```json
{
  "stage": "qualificado"
}
```

### 3. **Frontend - crm.js**

Implementada a função `salvarPosicaoNoBanco` que:
- ✅ Faz requisição PUT para o backend
- ✅ Envia o novo stage do lead
- ✅ Trata erros e exibe feedback
- ✅ Registra logs no console
- ✅ **Limpa localStorage após salvar com sucesso**
- ✅ **Atualiza array global leadsGlobais para manter sincronização**

```javascript
async function salvarPosicaoNoBanco(leadId, novoStage) {
    const response = await fetch(`/api/leads/${leadId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: novoStage })
    });
    
    // Após sucesso, limpa localStorage e atualiza array global
    localStorage.removeItem(`lead_position_${leadId}`);
    // ...
}
```

### 4. **Frontend - Integração com Drag & Drop**

Atualizada a função `drop` para chamar `salvarPosicaoNoBanco`:

```javascript
function drop(ev) {
    // ... código de drag & drop ...
    
    // localStorage salvo apenas como backup temporário
    localStorage.setItem(`lead_position_${leadId}`, novaColuna);
    
    // Salva no banco (fonte única da verdade)
    salvarPosicaoNoBanco(leadId, novaColuna);
}
```

### 5. **Frontend - Carregamento Inicial Corrigido**

Função `criarCardLead` agora usa **apenas o stage do banco**:

```javascript
function criarCardLead(resposta, formulario, stageSalva = null) {
    // ANTES: usava localStorage como fallback
    // const posicaoSalva = stageSalva || localStorage.getItem(...) || 'entrou';
    
    // AGORA: usa apenas stage do banco
    const posicaoSalva = stageSalva || 'entrou';
    
    // Lead é posicionado na coluna correta do banco
    // ...
}
```

## 🔄 Fluxo Completo

### Ao Carregar o CRM (Inicialização)

```
1. Usuário clica no menu "CRM"
   ↓
2. carregarLeadsCRM() é chamada
   ↓
3. Requisição GET /api/leads busca leads do banco
   ↓
4. Cada lead retorna com seu stage do banco
   ↓
5. processarLeadDoBanco(lead) extrai o stage
   ↓
6. criarCardLead(resposta, formulario, stage)
   ↓
7. Lead é posicionado na coluna correta (stage do banco)
   ↓
8. localStorage NÃO é usado para posicionamento inicial
   ↓
9. Contadores e filtros são atualizados
```

### Ao Arrastar um Lead (Drag & Drop)

```
1. Usuário arrasta card no Kanban
   ↓
2. Evento dragstart captura ID do lead
   ↓
3. Evento drop identifica nova coluna
   ↓
4. Card move visualmente
   ↓
5. localStorage salva posição (backup temporário)
   ↓
6. salvarPosicaoNoBanco() chama API PUT
   ↓
7. Backend valida permissões
   ↓
8. Banco de dados é atualizado (stage + updated_at)
   ↓
9. localStorage é LIMPO após sucesso
   ↓
10. Array global (leadsGlobais) é atualizado
   ↓
11. Feedback ao usuário (log/toast)
```

### Em Caso de Erro

```
Se salvar no banco falhar:
  ↓
1. localStorage mantém posição como backup
   ↓
2. Erro é mostrado ao usuário
   ↓
3. Lead permanece na nova posição visualmente
   ↓
4. Ao recarregar, volta para stage do banco
   ↓
5. Usuário pode tentar mover novamente
```

## ✅ Validações Implementadas

### Backend

1. **ID do lead**: Obrigatório
2. **Stage**: Obrigatório e deve ser um dos valores válidos
3. **Autenticação**: Usuário deve estar logado
4. **Permissionamento**:
   - ADMIN/GESTOR: Pode atualizar qualquer lead
   - USER: Só pode atualizar leads de suas empresas vinculadas
5. **Existência do lead**: Verifica se o lead existe no banco
6. **Empresa vinculada**: Lead deve ter `empresa_id` no `dados_originais`

### Frontend

1. **Validação de resposta**: Trata erros da API
2. **Feedback visual**: Logs no console
3. **Fallback**: Mantém localStorage como backup

## 🎯 Stages Válidos

Os stages permitidos no sistema são:

- `entrou` - Lead inicial que entrou no funil
- `qualificado` - Lead qualificado como potencial cliente
- `conversao` - Lead em processo de conversão/negociação
- `ganho` - Lead convertido em cliente

## 🧪 Como Testar

### 1. Reiniciar o servidor (se estiver rodando)

```powershell
# Se o servidor estiver rodando, pare com Ctrl+C e reinicie
npm start
```

### 2. Abrir o navegador e fazer login

```
http://localhost:3000/login.html
```

### 3. Navegar para o CRM

Clique no menu "CRM" para abrir o Kanban

### 4. Testar drag & drop

1. Arraste um card de uma coluna para outra
2. Veja os logs no console (F12):
   ```
   Lead 123 movido para qualificado
   💾 Salvando stage do lead 123 no banco: qualificado
   ✅ Stage do lead 123 atualizado com sucesso no banco
   ```

### 5. Verificar persistência

1. Recarregue a página (F5 ou Ctrl+R)
2. O lead deve permanecer na nova coluna
3. Faça login com outro usuário (se tiver permissão para ver o lead)
4. O lead deve estar na coluna correta

### 6. Verificar logs no servidor

No terminal onde o servidor está rodando, você verá:

```
🔄 [CrmController] Atualizando stage do lead 123 para qualificado
✅ [CrmController] Stage atualizado - Lead 123 -> qualificado
```

### 7. Verificar no banco de dados (opcional)

```sql
SELECT id, nome, stage, updated_at 
FROM leads 
WHERE id = 123;
```

## 🐛 Troubleshooting

### Lead não move

**Sintoma:** Card não se move visualmente
**Solução:** 
- Verifique console (F12) por erros JavaScript
- Verifique se as colunas têm o atributo `data-stage` correto

### Lead move mas volta ao recarregar

**Sintoma:** Lead move visualmente mas volta à posição original ao recarregar
**Causa:** Erro ao salvar no banco
**Solução:**
- Veja logs no console (F12)
- Veja logs no servidor
- Verifique se usuário tem permissão
- Verifique se servidor está rodando

### Erro 401 (Não autenticado)

**Sintoma:** Console mostra erro 401
**Solução:**
- Faça logout e login novamente
- Verifique se sessão não expirou

### Erro 403 (Sem permissão)

**Sintoma:** Console mostra erro 403
**Causa:** Usuário USER tentando atualizar lead de empresa não vinculada
**Solução:**
- Verifique se usuário está vinculado à empresa do lead
- Use conta ADMIN/GESTOR para testar

### Erro 404 (Lead não encontrado)

**Sintoma:** Console mostra erro 404
**Causa:** Lead não existe no banco
**Solução:**
- Recarregue a lista de leads
- Verifique se lead foi excluído

## 📝 Observações Importantes

1. **Banco de dados é a fonte única da verdade** 
   - Ao carregar o CRM, os leads são posicionados de acordo com o `stage` do banco
   - localStorage é usado apenas como backup temporário durante o drag
   - Após salvar com sucesso no banco, localStorage é limpo

2. **Sincronização automática**
   - Array global `leadsGlobais` é atualizado após salvar no banco
   - Mantém interface sincronizada sem precisar recarregar página

3. **Permissionamento é aplicado** - USER só atualiza leads de suas empresas

4. **Logs detalhados** facilitam debugging (frontend e backend)

5. **Feedback visual** pode ser expandido com toasts/notificações

6. **Campo `updated_at`** é atualizado automaticamente no banco

7. **Fallback inteligente**
   - Se API falhar, localStorage mantém posição temporária
   - Ao recarregar, volta para stage real do banco
   - Usuário pode tentar mover novamente

## 🚀 Melhorias Futuras (Opcional)

1. **Undo/Redo:** Implementar desfazer última ação
2. **Histórico:** Registrar todas as mudanças de stage em tabela separada
3. **Notificações:** Avisar outros usuários sobre mudanças em tempo real
4. **Otimização:** Debounce para evitar múltiplas chamadas simultâneas
5. **Drag visual:** Melhorar feedback visual durante o arrasto
6. **Confirmação:** Pedir confirmação ao mover para "ganho"

## 📄 Arquivos Modificados

1. ✅ `backend/controllers/CrmController.js` - Novo método `atualizarStage`
2. ✅ `backend/routes/api.js` - Nova rota `PUT /leads/:id/stage`
3. ✅ `public/js/crm.js` - Nova função `salvarPosicaoNoBanco` + integração

## ✅ Status

- [x] Backend implementado
- [x] Rotas configuradas
- [x] Frontend implementado
- [x] Validações adicionadas
- [x] Permissionamento aplicado
- [x] Logs adicionados
- [x] Documentação criada
- [ ] Testes realizados (aguardando usuário testar)

---

**Data:** 27 de outubro de 2025
**Autor:** GitHub Copilot
**Versão:** 1.0
