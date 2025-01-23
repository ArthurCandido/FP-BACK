const express = require('express');
const router = express.Router();
const pool = require('../db');
const errorResponse = require('./../ferramentas/errorResponse');
const verificarClt = require('../middlewares/middlewareCLT');
const autenticarToken = require('../middlewares/middlewareUser');

// Rota: Listar holerites com filtro
router.get('/holerite', autenticarToken, verificarClt, async (req, res) => {
    const { mes, ano} = req.query;
    cpf_usuario = req.user.cpf;

    let query = 'SELECT mes, ano, cpf_usuario, caminho_documento FROM holerite';
    const params = [];
    const conditions = [];

    if (mes) {
        conditions.push('mes = $' + (params.length + 1));
        params.push(mes);
    }
    if (ano) {
        conditions.push('ano = $' + (params.length + 1));
        params.push(ano);
    }
    if (cpf_usuario) {
        conditions.push('cpf_usuario = $' + (params.length + 1));
        params.push(cpf_usuario);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar holerites.', error.message);
    }
});

// Rotas: Testar autenticação para CLT
router.get('/testar-autenticacao', autenticarToken, verificarClt, (req, res) => {
    res.json({ message: 'Autenticação válida para CLT.', user: req.user });
});

module.exports = router;