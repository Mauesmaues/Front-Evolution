// Rotas da API (opcional)
const express = require('express');
const router = express.Router();

const EmpresaController = require('../controllers/EmpresaController');
const usuarioController = require('../controllers/UsuarioController');

const testeCrm = require('../service/CrmService');
router.get('/testeCrm', testeCrm.getData);

router.post('/criarEmpresa', EmpresaController.create);
router.get('/buscarEmpresas', EmpresaController.buscarEmpresas)
router.post('/login', usuarioController.login);
router.post('/criarUsuario', usuarioController.criarUsuario)
router.get('/session-user', usuarioController.usuarioSecao);




module.exports = router;
