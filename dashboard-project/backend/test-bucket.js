// Carregar variáveis de ambiente
require('dotenv').config({ path: __dirname + '/.env' });

const supabase = require('./utils/supabaseCliente');

async function verificarECriarBucket() {
    try {
        console.log('🔍 Verificando buckets existentes...\n');
        
        // Listar todos os buckets
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('❌ Erro ao listar buckets:', listError);
            return;
        }
        
        console.log('📦 Buckets encontrados:', buckets.map(b => b.name).join(', ') || 'Nenhum');
        
        // Verificar se o bucket 'arquivos-propostas' existe
        const bucketExists = buckets.some(b => b.name === 'arquivos-propostas');
        
        if (!bucketExists) {
            console.log('\n⚠️ Bucket "arquivos-propostas" não encontrado. Criando...');
            
            const { data: newBucket, error: createError } = await supabase.storage.createBucket('arquivos-propostas', {
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                ]
            });
            
            if (createError) {
                console.error('❌ Erro ao criar bucket:', createError);
                console.log('\n📋 INSTRUÇÕES MANUAIS:');
                console.log('1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/storage/buckets');
                console.log('2. Clique em "New bucket"');
                console.log('3. Nome: arquivos-propostas');
                console.log('4. Marque como "Public bucket"');
                console.log('5. File size limit: 50 MB');
                console.log('6. Clique em "Create bucket"\n');
                return;
            }
            
            console.log('✅ Bucket "arquivos-propostas" criado com sucesso!');
        } else {
            console.log('\n✅ Bucket "arquivos-propostas" já existe!');
        }
        
        // Testar upload
        console.log('\n🧪 Testando upload de arquivo...');
        const testContent = 'Teste de upload';
        const testFileName = `test-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('arquivos-propostas')
            .upload(`propostas/${testFileName}`, testContent, {
                contentType: 'text/plain'
            });
        
        if (uploadError) {
            console.error('❌ Erro no teste de upload:', uploadError);
            return;
        }
        
        console.log('✅ Teste de upload bem-sucedido!');
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from('arquivos-propostas')
            .getPublicUrl(`propostas/${testFileName}`);
        
        console.log('🔗 URL pública do arquivo de teste:', publicUrlData.publicUrl);
        
        // Limpar arquivo de teste
        console.log('\n🧹 Limpando arquivo de teste...');
        await supabase.storage
            .from('arquivos-propostas')
            .remove([`propostas/${testFileName}`]);
        
        console.log('✅ Sistema de storage configurado e funcionando corretamente!');
        
    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

// Executar verificação
verificarECriarBucket();
