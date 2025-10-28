# 🔧 INSTALAÇÃO: Sistema de Stages Personalizáveis

## ⚠️ IMPORTANTE - MIGRAÇÃO NECESSÁRIA

Ao implementar stages personalizáveis, você precisa executar scripts SQL no banco de dados para:
1. **Remover constraint antiga** de stages fixos
2. **Criar tabela** `empresa_stages`

---

## 📋 Checklist de Instalação

Execute os passos abaixo **NA ORDEM**:

### ✅ Passo 1: Remover Constraint de Stage (OBRIGATÓRIO)

**Problema:** A tabela `leads` tem uma constraint que só aceita estes valores:
- `entrou`
- `agendou`
- `analisando`
- `fechou`

Com stages dinâmicos, **qualquer valor** deve ser aceito.

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
```

**Arquivo completo:** `docs/fix-stage-constraint.sql`

**Como executar:**
1. Acesse o **Supabase SQL Editor**
2. Abra o arquivo `docs/fix-stage-constraint.sql`
3. Copie e cole o conteúdo
4. Execute (Run)
5. Verifique se não há erros

**Verificação:**
```sql
-- Este comando deve funcionar sem erro:
UPDATE leads SET stage = 'teste_personalizado' WHERE id = 1;

-- Se funcionar, a constraint foi removida com sucesso!
-- Depois reverta:
UPDATE leads SET stage = 'entrou' WHERE id = 1;
```

---

### ✅ Passo 2: Criar Tabela empresa_stages (OBRIGATÓRIO)

**Arquivo:** `docs/empresa-stages-database.sql`

**Como executar:**
1. Acesse o **Supabase SQL Editor**
2. Abra o arquivo `docs/empresa-stages-database.sql`
3. Copie e cole o conteúdo completo
4. Execute (Run)
5. Verifique se a tabela foi criada

**Verificação:**
```sql
-- Deve retornar a estrutura da tabela:
SELECT * FROM information_schema.tables 
WHERE table_name = 'empresa_stages';

-- Deve estar vazio inicialmente:
SELECT * FROM empresa_stages;
```

---

## 🚨 Sintomas de Instalação Incompleta

### Erro 1: "violates check constraint leads_stage_check"
```
❌ [CrmController] Erro ao atualizar stage: {
  code: '23514',
  message: 'new row for relation "leads" violates check constraint "leads_stage_check"'
}
```

**Causa:** Constraint antiga ainda existe  
**Solução:** Execute o **Passo 1** (remover constraint)

---

### Erro 2: "relation empresa_stages does not exist"
```
❌ [StageController] Erro ao buscar stages: relation "empresa_stages" does not exist
```

**Causa:** Tabela não foi criada  
**Solução:** Execute o **Passo 2** (criar tabela)

---

### Erro 3: Stages não aparecem no modal
**Causa:** Backend não consegue buscar stages  
**Solução:**
1. Abra o console do navegador (F12)
2. Veja se há erro 500 ou 404
3. Execute os Passos 1 e 2

---

## 🔄 Migração de Dados Existentes

### Cenário: Tenho leads com stages antigos

**Boa notícia:** Não é necessário migrar! Os stages antigos (`entrou`, `agendou`, etc.) continuam funcionando.

**Como funciona:**
1. Sistema busca stages personalizados da empresa
2. Se não existir, usa stages padrão (que incluem os antigos)
3. Leads antigos aparecem nas colunas corretas

### Cenário: Quero usar novos stages

**Opções:**

**Opção A - Deixar como está:**
- Leads antigos ficam nos stages antigos
- Novos leads usam stages personalizados
- Você move manualmente conforme necessário

**Opção B - Migração manual:**
```sql
-- Exemplo: Migrar todos leads de 'agendou' para 'qualificado'
UPDATE leads 
SET stage = 'qualificado' 
WHERE stage = 'agendou';
```

**Opção C - Criar stages compatíveis:**
No modal, crie stages com os mesmos IDs antigos:
```json
[
  {"id": "entrou", "nome": "Novo Lead", "cor": "#2196F3", "ordem": 1},
  {"id": "agendou", "nome": "Qualificado", "cor": "#FF9800", "ordem": 2},
  {"id": "analisando", "nome": "Em Negociação", "cor": "#9C27B0", "ordem": 3},
  {"id": "fechou", "nome": "Ganho", "cor": "#4CAF50", "ordem": 4}
]
```

---

## 🧪 Testes Pós-Instalação

Execute estes testes para validar a instalação:

### Teste 1: Backend
```bash
# No terminal do servidor:
# Deve aparecer sem erros ao abrir CRM
```

**Esperado nos logs:**
```
📋 [CRM] Carregando stages da empresa 1...
✅ [CRM] 4 stages carregados
```

### Teste 2: Modal
1. Abra o CRM
2. Clique em "Gerenciar Etapas"
3. Modal deve abrir
4. Deve mostrar stages padrão ou customizados

### Teste 3: Drag & Drop
1. Arraste um lead para outra coluna
2. Deve salvar sem erro
3. Recarregue a página
4. Lead deve estar na nova coluna

### Teste 4: Criar Stage Personalizado
1. Abra modal "Gerenciar Etapas"
2. Clique "Adicionar Nova Etapa"
3. Preencha: Nome = "Teste", Cor = Vermelho
4. Salve
5. CRM deve recarregar
6. Nova coluna deve aparecer

---

## 📊 Scripts SQL - Resumo

### Script 1: fix-stage-constraint.sql
**Propósito:** Remover constraint que limita valores de stage  
**Quando executar:** Antes de usar stages personalizados  
**Reversível:** Sim (mas não recomendado)

### Script 2: empresa-stages-database.sql
**Propósito:** Criar tabela para armazenar stages  
**Quando executar:** Na primeira instalação  
**Reversível:** Sim (`DROP TABLE empresa_stages`)

---

## 🔒 Segurança e Permissões

### Permissões do Banco
Certifique-se que o usuário do Supabase tem permissões:
- `ALTER TABLE` (para remover constraint)
- `CREATE TABLE` (para criar empresa_stages)
- `INSERT, UPDATE, DELETE, SELECT` em ambas tabelas

### RLS (Row Level Security)
Se você usa RLS no Supabase, adicione policies para `empresa_stages`:

```sql
-- Policy para leitura (todos usuários autenticados)
CREATE POLICY "Usuários podem ver stages de suas empresas"
ON empresa_stages FOR SELECT
USING (
  id_empresa IN (
    SELECT empresa_id FROM usuario_empresa 
    WHERE usuario_id = auth.uid()
  )
);

-- Policy para escrita (apenas ADMIN/GESTOR)
CREATE POLICY "ADMIN/GESTOR podem gerenciar stages"
ON empresa_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND permissao IN ('ADMIN', 'GESTOR')
  )
);
```

---

## ❓ FAQ

**P: O que acontece se eu não executar os scripts?**  
R: O sistema não funcionará. Drag & drop falhará com erro de constraint.

**P: Posso executar os scripts em produção?**  
R: Sim, mas faça backup antes. Os scripts são seguros e não deletam dados.

**P: E se eu tiver muitas empresas?**  
R: Cada empresa pode ter seus próprios stages. Não há limite.

**P: Posso voltar ao sistema antigo?**  
R: Não recomendado, mas tecnicamente sim:
1. DELETE FROM empresa_stages;
2. Adicione a constraint antiga de volta

**P: Preciso reiniciar o servidor?**  
R: Não. As mudanças são no banco, o backend continua funcionando.

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique logs do backend** (terminal do servidor)
2. **Verifique console do navegador** (F12)
3. **Teste conexão com banco** (Supabase dashboard)
4. **Revise os passos** desta documentação

**Logs importantes:**
- `❌ [CrmController]` = Erro no backend
- `❌ [StageController]` = Erro ao gerenciar stages
- `❌ [CRM]` = Erro no frontend

---

## ✅ Checklist Final

Antes de usar em produção, confirme:

- [ ] Executei `fix-stage-constraint.sql`
- [ ] Executei `empresa-stages-database.sql`
- [ ] Testei drag & drop funcionando
- [ ] Testei modal de gerenciamento
- [ ] Criei stages personalizados de teste
- [ ] Verifiquei logs sem erros
- [ ] Fiz backup do banco
- [ ] Li o guia completo (`stages-personalizaveis-guia.md`)

---

**Boa instalação! 🚀**

**Versão:** 2.0.0  
**Data:** Janeiro 2025  
**Autor:** Dashboard Project Team
