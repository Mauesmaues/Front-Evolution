/**
 * Script para testar o envio de notificações de saldo baixo
 * Uso: node scripts/enviar-notificacoes-saldo-baixo.js
 */

const fetch = require('node-fetch');

async function testarEnvioNotificacoes() {
    try {
        console.log('🚀 Testando envio de notificações de saldo baixo...\n');
        
        const response = await fetch('http://localhost:3000/api/enviar-notificacoes-saldo-baixo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const resultado = await response.json();
        
        console.log('\n📊 Resultado:');
        console.log(JSON.stringify(resultado, null, 2));
        
        if (resultado.success) {
            console.log('\n✅ Notificações enviadas com sucesso!');
        } else {
            console.log('\n⚠️ Erro ao enviar notificações:', resultado.message);
        }
        
    } catch (error) {
        console.error('\n❌ Erro ao executar teste:', error);
    }
}

testarEnvioNotificacoes();
