// Rotas da API (opcional)
const express = require('express');
const router = express.Router();

const EmpresaController = require('../controllers/EmpresaController');
const usuarioController = require('../controllers/UsuarioController');
const NotificacaoController = require('../controllers/NotificacaoController');
const { carregarEmpresasPermitidas } = require('../controllers/PermissaoController');
const NotificacaoScheduler = require('../schedulers/NotificacaoScheduler');

const testeCrm = require('../service/CrmService');
router.get('/testeCrm', testeCrm.getData);

router.post('/criarEmpresa', EmpresaController.create);
router.get('/buscarEmpresas', EmpresaController.buscarEmpresas)
router.post('/login', usuarioController.login);
router.post('/criarUsuario', usuarioController.criarUsuario)
router.get('/session-user', usuarioController.usuarioSecao);
router.post('/sair', usuarioController.sair);
router.get('/permission/:userId', carregarEmpresasPermitidas );

// Rotas de notificações
router.post('/criarNotificacao', NotificacaoController.criarNotificacao);
router.get('/buscarNotificacoes', NotificacaoController.buscarNotificacoes);
router.delete('/excluirNotificacao/:id', NotificacaoController.excluirNotificacao);
router.post('/enviarNotificacao', NotificacaoController.enviarNotificação);

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

module.exports = router;
