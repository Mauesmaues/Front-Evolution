// Rotas da API (opcional)
const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/EmpresaController');
const usuarioController = require('../controllers/UsuarioController');
router.post('/criarEmpresa', EmpresaController.create);
router.get('/buscarEmpresas', EmpresaController.buscarEmpresas);
router.post('/criarUsuario', usuarioController.criarUsuario)



module.exports = router;
