const express = require('express');
const router = express.Router();
const pool = require('../db');
const errorResponse = require('./../ferramentas/errorResponse');
const verificarPj = require('../middlewares/middlewarePJ');
const autenticarToken = require('../middlewares/middlewareUser');

// Rotas: Testar autenticação para PJ
router.get('/testar-autenticacao', autenticarToken, verificarPj, (req, res) => {
    res.json({ message: 'Autenticação válida para PJ.', user: req.user });
});

module.exports = router;