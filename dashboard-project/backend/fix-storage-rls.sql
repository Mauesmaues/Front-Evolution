-- ========================================
-- 🔒 CORREÇÃO DAS POLÍTICAS RLS DO STORAGE
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard/project/bfclrfxsxiafmbwywqpw/editor

-- 1️⃣ Garantir que RLS está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Remover políticas antigas se existirem (evita erro de duplicação)
DROP POLICY IF EXISTS "Permitir upload público" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização pública" ON storage.objects;

-- 3️⃣ Criar política de INSERT (Upload de arquivos)
CREATE POLICY "Permitir upload público"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'arquivos-propostas');

-- 4️⃣ Criar política de SELECT (Leitura/Download de arquivos)
CREATE POLICY "Permitir leitura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'arquivos-propostas');

-- 5️⃣ Criar política de DELETE (Exclusão de arquivos)
CREATE POLICY "Permitir exclusão pública"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'arquivos-propostas');

-- 6️⃣ Criar política de UPDATE (Atualização de arquivos)
CREATE POLICY "Permitir atualização pública"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'arquivos-propostas')
WITH CHECK (bucket_id = 'arquivos-propostas');

-- ========================================
-- ✅ VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ========================================
SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  permissive as "Permissivo",
  roles as "Roles",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%público%'
ORDER BY policyname;

-- ========================================
-- 📊 RESULTADO ESPERADO
-- ========================================
-- Você deve ver 4 políticas listadas:
-- 1. Permitir upload público     | INSERT | public
-- 2. Permitir leitura pública    | SELECT | public
-- 3. Permitir exclusão pública   | DELETE | public
-- 4. Permitir atualização pública| UPDATE | public
