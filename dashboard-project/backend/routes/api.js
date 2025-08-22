// Rotas da API (opcional)
const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/EmpresaController');
router.post('/criarEmpresa', EmpresaController.create);


module.exports = router;
