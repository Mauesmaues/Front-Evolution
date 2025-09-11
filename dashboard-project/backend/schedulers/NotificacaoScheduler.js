const cron = require('node-cron');
const NotificacaoController = require('../controllers/NotificacaoController');

class NotificacaoScheduler {
    
    static iniciarAgendamentos() {
        console.log('🕐 Iniciando agendamentos de notificações...');
        
        // Executa todos os dias às 18:00 (18h)
        // Formato: segundo minuto hora dia mês dia-da-semana
        // '0 0 18 * * *' = 0 segundos, 0 minutos, 18 horas, todos os dias, todos os meses, todos os dias da semana
        cron.schedule('0 0 18 * * *', async () => {
            console.log('⏰ Executando envio de notificações diárias às 18:00');
            
            try {
                // Criar um objeto mock de request e response
                const mockReq = {};
                const mockRes = {
                    json: (data) => {
                        console.log('✅ Resposta do envio:', data);
                        return mockRes;
                    },
                    status: (code) => {
                        console.log(`📊 Status code: ${code}`);
                        return mockRes;
                    }
                };
                
                // Executar o método de enviar notificação
                await NotificacaoController.enviarNotificação(mockReq, mockRes);
                
            } catch (error) {
                console.error('❌ Erro ao executar envio automático de notificações:', error);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo" // Fuso horário do Brasil
        });
        
        console.log('✅ Agendamento configurado para 18:00 todos os dias');
    }
    
    // Método para testar o agendamento (executa imediatamente)
    static async testarEnvio() {
        console.log('🧪 Teste: Executando envio de notificações...');
        
        try {
            const mockReq = {};
            const mockRes = {
                json: (data) => {
                    console.log('✅ Teste - Resposta do envio:', data);
                    return mockRes;
                },
                status: (code) => {
                    console.log(`📊 Teste - Status code: ${code}`);
                    return mockRes;
                }
            };
            
            await NotificacaoController.enviarNotificação(mockReq, mockRes);
            
        } catch (error) {
            console.error('❌ Erro no teste de envio:', error);
        }
    }
    
    // Método para configurar diferentes horários (opcional)
    static configurarHorarioPersonalizado(horario, callback) {
        // Exemplo: configurarHorarioPersonalizado('0 30 9 * * *', funcao) para 9:30
        cron.schedule(horario, callback, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });
        
        console.log(`✅ Agendamento personalizado configurado: ${horario}`);
    }
    
    // Método para listar todos os agendamentos ativos
    static listarAgendamentos() {
        const tasks = cron.getTasks();
        console.log(`📋 Total de agendamentos ativos: ${tasks.size}`);
        return tasks;
    }
    
    // Método para parar todos os agendamentos
    static pararAgendamentos() {
        cron.getTasks().forEach(task => {
            task.stop();
        });
        console.log('⏹️ Todos os agendamentos foram parados');
    }
}

module.exports = NotificacaoScheduler;