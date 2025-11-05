
// Rotas da API (opcional)
const express = require('express');
const router = express.Router();

const MetaConversionController = require('../controllers/MetaConversionController');

const EmpresaController = require('../controllers/EmpresaController');
const usuarioController = require('../controllers/UsuarioController');
const NotificacaoController = require('../controllers/NotificacaoController');
const NumeroNotificacaoController = require('../controllers/NumeroNotificacaoController');
const PropostaController = require('../controllers/PropostaController');
const { UploadController, uploadMiddleware } = require('../controllers/UploadController');
const { carregarEmpresasPermitidas } = require('../controllers/PermissaoController');
const NotificacaoScheduler = require('../schedulers/NotificacaoScheduler');
const VisualPropostaController = require('../controllers/VisualPropostaController');
const CrmController = require('../controllers/CrmController');
const StageController = require('../controllers/StageController');
const TrackeamentoController = require('../controllers/TrackeamentoController');

const testeCrm = require('../service/CrmService');
router.get('/testeCrm', testeCrm.getData);

// Enviar lead qualificado para o Meta (API de Conversões)
router.post('/leads/:id/enviar-para-meta/:empresaId', MetaConversionController.enviarLead);

router.post('/criarEmpresa', EmpresaController.create);
router.get('/buscarEmpresas', EmpresaController.buscarEmpresas);
router.put('/atualizarEmpresa/:id', EmpresaController.atualizarEmpresa);
router.delete('/excluirEmpresa/:id', EmpresaController.excluirEmpresa);
router.post('/empresa/manuais', EmpresaController.salvarCamposManuais);
router.post('/login', usuarioController.login);
router.post('/criarUsuario', usuarioController.criarUsuario)
router.get('/listarUsuarios', usuarioController.listarUsuarios);
router.put('/atualizarUsuario/:id', usuarioController.atualizarUsuario);
router.delete('/removerUsuario/:id', usuarioController.removerUsuario);
router.post('/adicionarEmpresaUsuario', usuarioController.adicionarEmpresaAoUsuario);
router.get('/session-user', usuarioController.usuarioSecao);
router.post('/sair', usuarioController.sair);
router.get('/permission/:userId', carregarEmpresasPermitidas );

// ========== ROTAS DE CRM ==========
// Receber lead único de fonte externa (Google Sheets, Apps Script, etc)
router.post('/leads', CrmController.receberLeadExterno);

// Receber múltiplos leads de uma vez (batch)
router.post('/leads/batch', CrmController.receberLeadsBatch);

// Listar leads (com permissionamento por empresa)
router.get('/leads', CrmController.listarLeads);

// Adicionar lead manualmente pelo frontend
router.post('/leads/manual', CrmController.adicionarLeadManual);

// Atualizar stage de um lead (drag and drop no Kanban)
router.put('/leads/:id/stage', CrmController.atualizarStage);

// Marcar lead como qualificado (otimização de campanhas)
router.post('/leads/:id/qualificado', CrmController.marcarLeadQualificado);

// ========== ROTAS DE STAGES (ETAPAS PERSONALIZÁVEIS) ==========
// Buscar stages de uma empresa (retorna padrão se não existir)
router.get('/stages/:empresaId', StageController.buscarStages);

// Salvar/atualizar stages de uma empresa
router.post('/stages/:empresaId', StageController.salvarStages);

// Resetar stages para o padrão
router.delete('/stages/:empresaId', StageController.resetarStages);
// ===================================

// Rotas de notificações
router.post('/criarNotificacao', NotificacaoController.criarNotificacao);
router.get('/buscarNotificacoes', NotificacaoController.buscarNotificacoes);
router.delete('/excluirNotificacao/:id', NotificacaoController.excluirNotificacao);
router.post('/enviarNotificacao', NotificacaoController.enviarNotificação);

// Rotas de números para notificação de saldo baixo
router.get('/numeros-notificacao', NumeroNotificacaoController.listarNumeros);
router.post('/numeros-notificacao', NumeroNotificacaoController.adicionarNumero);
router.delete('/numeros-notificacao/:id', NumeroNotificacaoController.excluirNumero);
router.post('/enviar-notificacoes-saldo-baixo', NumeroNotificacaoController.enviarNotificacoesSaldoBaixo);

// Rotas de agendamento
router.post('/testarEnvioNotificacao', async (req, res) => {
    try {
        await NotificacaoScheduler.testarEnvio();
        res.json({ success: true, message: 'Teste de envio executado com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no teste de envio', error: error.message });
    }
});

router.get('/statusAgendamentos', (req, res) => {
    try {
        const agendamentos = NotificacaoScheduler.listarAgendamentos();
        res.json({ 
            success: true, 
            totalAgendamentos: agendamentos.size,
            message: 'Agendamentos listados com sucesso' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar agendamentos', error: error.message });
    }
});

// Rotas de propostas
router.post('/criarProposta', PropostaController.criarProposta);
router.get('/listarPropostas', PropostaController.listarPropostas);
router.put('/atualizarProposta/:id', PropostaController.atualizarProposta);
router.delete('/excluirProposta/:id', PropostaController.excluirProposta);
router.post('/registrarAberturaProposta', PropostaController.registrarAbertura);
router.get('/empresasDisponiveis', PropostaController.buscarEmpresasDisponiveis);
router.get('/proposta/:id/aberturas', PropostaController.listarAberturas);

// Rotas de upload de arquivos
router.post('/upload-arquivo', uploadMiddleware, UploadController.uploadArquivo);
router.delete('/excluir-arquivo', UploadController.excluirArquivo);

// Rotas para proposta pública
router.get('/proposta/:id', PropostaController.buscarPropostaPorId);
router.post('/proposta/:id/visualizar', PropostaController.registrarVisualizacao);

// Rotas de configuração visual das propostas
router.post('/configuracoes/visuais', VisualPropostaController.upload.single('logo'), VisualPropostaController.salvarVisual);
router.get('/configuracoes/visuais', VisualPropostaController.buscarVisualUsuarioAtual);
router.get('/configuracoes/visuais/:empresaId', VisualPropostaController.buscarVisualPorEmpresa);

// Rota para processar proposta
router.post('/enviarProposta', (req, res) => {
    try {
        const { fullName, whatsapp } = req.body;
        
        // Validação básica
        if (!fullName || !whatsapp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome e WhatsApp são obrigatórios' 
            });
        }
        
        // Aqui você pode integrar com:
        // - Banco de dados para salvar o lead
        // - API de WhatsApp para envio automático
        // - Sistema de CRM
        // - Email marketing
        
        console.log('Nova proposta recebida:', { fullName, whatsapp });
        
        res.json({ 
            success: true, 
            message: `Obrigado, ${fullName}! Sua proposta será liberada em breve.`,
            data: { fullName, whatsapp }
        });
        
    } catch (error) {
        console.error('Erro ao processar proposta:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor', 
            error: error.message 
        });
    }
});

// Trackeamento Avançado
router.post('/trackeamento/:empresaId', TrackeamentoController.salvarChave);
router.get('/trackeamento/:empresaId', TrackeamentoController.buscarChave);

module.exports = router;
