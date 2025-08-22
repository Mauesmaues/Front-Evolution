const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Debug: verificar se as variáveis estão sendo carregadas
console.log('🔍 Debug Supabase:');
console.log('URL:', supabaseUrl ? 'Carregada' : 'VAZIA');
console.log('KEY:', supabaseKey ? 'Carregada (tamanho: ' + supabaseKey.length + ')' : 'VAZIA');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não encontradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;