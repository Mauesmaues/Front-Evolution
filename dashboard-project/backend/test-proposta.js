const supabase = require('./utils/supabaseCliente');

async function teste() {
  try {
    console.log('🔍 Verificando estrutura atual...\n');
    
    // Verificar se existem propostas
    const { data: propostas, error } = await supabase
      .from('propostas')
      .select(`
        *,
        empresas:empresa_id (
          id,
          nome
        ),
        usuarios:usuario_id (
          id,
          nome
        )
      `)
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao buscar propostas:', error);
      return;
    }
    
    console.log(`📊 Total de propostas encontradas: ${propostas.length}\n`);
    
    if (propostas.length === 0) {
      console.log('🔧 Nenhuma proposta encontrada. Vou criar propostas de teste...\n');
      
      // Criar propostas de teste
      const propostasTest = [
        {
          nome: 'Proposta Arquivo - WhatsApp Obrigatório',
          pedir_whatsapp: true,
          tipo: 'arquivo',
          arquivo: { 
            url: 'https://example.com/arquivo1.pdf', 
            nome: 'proposta-comercial.pdf',
            downloadUrl: 'https://example.com/download/arquivo1.pdf'
          },
          status: 'Não aberta',
          visualizacoes: 0,
          empresa_id: 1,
          usuario_id: '00000000-0000-0000-0000-000000000001' // UUID de exemplo
        },
        {
          nome: 'Proposta Canva - Sem WhatsApp',
          pedir_whatsapp: false,
          tipo: 'canva',
          link_canva: 'https://www.canva.com/design/exemplo123',
          status: 'Não aberta',
          visualizacoes: 0,
          empresa_id: 1,
          usuario_id: '00000000-0000-0000-0000-000000000001'
        }
      ];
      
      for (const proposta of propostasTest) {
        const { data: novaProposta, error: errorCriar } = await supabase
          .from('propostas')
          .insert(proposta)
          .select()
          .single();
        
        if (errorCriar) {
          console.error('❌ Erro ao criar proposta:', errorCriar);
          continue;
        }
        
        console.log(`✅ Proposta criada: ${novaProposta.nome}`);
        console.log(`   🔗 URL de teste: http://localhost:3000/proposta.html?id=${novaProposta.id}`);
        console.log(`   📋 Tipo: ${novaProposta.tipo}`);
        console.log(`   📱 WhatsApp obrigatório: ${novaProposta.pedir_whatsapp}\n`);
      }
      
    } else {
      console.log('📝 Propostas existentes:\n');
      propostas.forEach((proposta, index) => {
        console.log(`${index + 1}. ${proposta.nome}`);
        console.log(`   🆔 ID: ${proposta.id}`);
        console.log(`   🔗 URL: http://localhost:3000/proposta.html?id=${proposta.id}`);
        console.log(`   📋 Tipo: ${proposta.tipo}`);
        console.log(`   📱 WhatsApp: ${proposta.pedir_whatsapp ? 'Obrigatório' : 'Opcional'}`);
        console.log(`   🏢 Empresa: ${proposta.empresas?.nome || 'N/A'}`);
        console.log(`   👤 Usuário: ${proposta.usuarios?.nome || 'N/A'}`);
        console.log(`   📊 Status: ${proposta.status} (${proposta.visualizacoes} visualizações)\n`);
      });
    }
    
    console.log('🎯 Teste completo! Use uma das URLs acima para testar a funcionalidade.');
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

teste();