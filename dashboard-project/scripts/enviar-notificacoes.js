// Script para executar envio de notificações via PM2
// Salve como: enviar-notificacoes.js

const fetch = require('node-fetch');

async function executarEnvio() {
    try {
        console.log('🚀 Iniciando envio de notificações...');
        
        const response = await fetch('http://localhost:3000/api/enviarNotificacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('✅ Notificações enviadas:', result);
        
    } catch (error) {
        console.error('❌ Erro ao enviar notificações:', error);
    }
    
    // Encerrar o processo
    process.exit(0);
}

executarEnvio();