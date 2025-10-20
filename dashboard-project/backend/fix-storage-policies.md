# 🔒 Configuração de Políticas do Supabase Storage

## Problema
Erro: `new row violates row-level security policy` ao tentar fazer upload de arquivos.

## Solução

### 1️⃣ Acesse o Dashboard do Supabase
1. Vá para: https://supabase.com/dashboard/project/bfclrfxsxiafmbwywqpw/storage/buckets
2. Clique no bucket **`arquivos-propostas`**
3. Vá na aba **"Policies"** (Políticas)

### 2️⃣ Crie as Políticas Necessárias

#### 📤 Política de INSERT (Upload)
```sql
-- Nome: "Permitir upload público"
-- Operation: INSERT
-- Policy definition:

CREATE POLICY "Permitir upload público"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'arquivos-propostas');
```

#### 📖 Política de SELECT (Leitura/Download)
```sql
-- Nome: "Permitir leitura pública"
-- Operation: SELECT
-- Policy definition:

CREATE POLICY "Permitir leitura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'arquivos-propostas');
```

#### 🗑️ Política de DELETE (Exclusão) - Opcional
```sql
-- Nome: "Permitir exclusão pública"
-- Operation: DELETE
-- Policy definition:

CREATE POLICY "Permitir exclusão pública"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'arquivos-propostas');
```

### 3️⃣ Passo a Passo pela Interface do Supabase

1. **Clique em "New Policy"** (Nova Política)
2. Escolha **"For full customization"** (Personalização completa)
3. **Nome da política**: `Permitir upload público`
4. **Allowed operation**: Selecione **INSERT**
5. **Target roles**: `public` (já vem selecionado)
6. **USING expression**: Deixe vazio
7. **WITH CHECK expression**: 
   ```sql
   bucket_id = 'arquivos-propostas'
   ```
8. Clique em **"Review"** e depois em **"Save policy"**

9. **Repita o processo** para a política de SELECT:
   - Nome: `Permitir leitura pública`
   - Operation: **SELECT**
   - **USING expression**: 
     ```sql
     bucket_id = 'arquivos-propostas'
     ```
   - WITH CHECK: deixe vazio

10. **Repita o processo** para a política de DELETE (se necessário):
    - Nome: `Permitir exclusão pública`
    - Operation: **DELETE**
    - **USING expression**: 
     ```sql
     bucket_id = 'arquivos-propostas'
     ```

### 4️⃣ Alternativa via SQL Editor

Se preferir usar o SQL Editor do Supabase:

1. Vá para: https://supabase.com/dashboard/project/bfclrfxsxiafmbwywqpw/editor
2. Execute o seguinte SQL:

```sql
-- Habilitar RLS na tabela storage.objects (se ainda não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Criar política de INSERT (upload)
CREATE POLICY "Permitir upload público"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'arquivos-propostas');

-- Criar política de SELECT (leitura/download)
CREATE POLICY "Permitir leitura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'arquivos-propostas');

-- Criar política de DELETE (exclusão)
CREATE POLICY "Permitir exclusão pública"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'arquivos-propostas');

-- Criar política de UPDATE (atualização) - se necessário
CREATE POLICY "Permitir atualização pública"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'arquivos-propostas')
WITH CHECK (bucket_id = 'arquivos-propostas');
```

### 5️⃣ Verificar Configuração

Após criar as políticas, volte para a interface de propostas e teste novamente o upload.

## 🔍 Verificação das Políticas

Para verificar se as políticas foram criadas corretamente, execute no SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
```

## 🎯 Resultado Esperado

Após configurar as políticas, você deve conseguir:
- ✅ Fazer upload de arquivos via UploadController
- ✅ Gerar URLs públicas acessíveis
- ✅ Fazer download dos arquivos pela URL pública
- ✅ Excluir arquivos se necessário

## ⚠️ Segurança

**IMPORTANTE**: Essas políticas permitem acesso público ao bucket. Se você precisar restringir o acesso:

### Para permitir apenas uploads autenticados:
```sql
-- Remova a política pública de INSERT e crie uma autenticada:
DROP POLICY "Permitir upload público" ON storage.objects;

CREATE POLICY "Permitir upload autenticado"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos-propostas');
```

### Para permitir apenas ao owner do arquivo:
```sql
-- Política que só permite upload com auth.uid() no path
CREATE POLICY "Upload com controle de usuário"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'arquivos-propostas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

Mas como estamos usando uma **chave anônima** (SUPABASE_KEY é uma anon key) e queremos que propostas sejam públicas, as políticas públicas são adequadas.
