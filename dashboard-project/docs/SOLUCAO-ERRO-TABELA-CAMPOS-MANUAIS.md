# 🔧 Instruções para Resolver o Erro da Tabela

## ❌ Problema Identificado

A tabela `controle_saldo_inputs_manuais` não existe no banco de dados Supabase.

**Erro:** `Could not find the table 'public.controle_saldo_inputs_manuais' in the schema cache`

---

## ✅ Solução

### Opção 1: Criar Nova Tabela (Recomendado se a tabela não existir)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `docs/criar-tabela-campos-manuais.sql`

**Conteúdo do Script:**
```sql
CREATE TABLE IF NOT EXISTS public.controle_saldo_inputs_manuais (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ultima_recarga DATE,
    saldo_diario DECIMAL(10, 2),
    recorrencia INTEGER, -- Número de dias
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_empresa)
);
```

---

### Opção 2: Alterar Tabela Existente (Se a tabela já existir com tipo VARCHAR)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `docs/alterar-recorrencia-para-integer.sql`

Este script irá:
- Criar uma coluna temporária `recorrencia_temp` como INTEGER
- Converter valores existentes (ex: "Mensal" → 30, "Semanal" → 7)
- Remover a coluna antiga
- Renomear a coluna temporária

---

## 🔍 Verificar se a Tabela Existe

Execute no SQL Editor do Supabase:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'controle_saldo_inputs_manuais';
```

Se retornar vazio, a tabela não existe → Use **Opção 1**  
Se retornar resultado, a tabela existe → Use **Opção 2** (se necessário alterar o tipo)

---

## 🎯 Estrutura da Tabela Final

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Chave primária |
| `id_empresa` | INTEGER | Referência à tabela empresas |
| `ultima_recarga` | DATE | Data da última recarga |
| `saldo_diario` | DECIMAL(10,2) | Saldo diário esperado |
| `recorrencia` | INTEGER | Periodicidade em dias (ex: 30, 7, 15) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

---

## 📝 Exemplos de Recorrência

| Tipo | Valor (dias) |
|------|--------------|
| Diário | 1 |
| Semanal | 7 |
| Quinzenal | 15 |
| Mensal | 30 |
| Bimestral | 60 |
| Trimestral | 90 |
| Semestral | 180 |
| Anual | 365 |

---

## ✅ Após Executar o Script

1. Recarregue a página do sistema
2. Preencha os 3 campos: **Última Recarga**, **Saldo Diário** e **Recorrência (dias)**
3. Clique no botão verde de salvar
4. Verifique se aparece ✅ de sucesso

---

## 🐛 Logs para Verificar

### Frontend (Console do Navegador)
```
✅ Campos salvos com sucesso
```

### Backend (Terminal Node)
```
✅ Campos manuais salvos com sucesso
```

---

## 📞 Se Ainda Houver Erro

Copie e envie:
1. Output do comando SQL de verificação
2. Logs completos do backend (Terminal Node)
3. Erros do console do navegador
