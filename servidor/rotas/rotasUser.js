const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const errorResponse = require('./../ferramentas/errorResponse');
const autenticarToken = require('../middlewares/middlewareUser');
const {cryptr, JWT_SECRET, invalidTokens} = require('../variaveis/variaveisUser');

// Rota: Desautenticar usuário
router.post('/desautenticar', autenticarToken, (req, res) => {
    invalidTokens.push(req.headers['authorization']);
    res.json({ message: 'Usuário desautenticado com sucesso.' });
});

// Rota: Autenticar usuário por cpf
router.post('/autenticar', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return errorResponse(res, 400, 'CPF e senha são obrigatórios.');
    }

    try {
        const { rows } = await pool.query('SELECT * FROM usuario WHERE cpf = $1', [cpf]);
        if (!rows.length || cryptr.decrypt(rows[0].senha) !== senha) {
            return errorResponse(res, 401, 'Credenciais inválidas.');
        }

        const token = jwt.sign({ cpf: rows[0].cpf, tipo: rows[0].tipo }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            message: 'Autenticado com sucesso.',
            token,
            tipo: rows[0].tipo
        });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao autenticar usuário.', error.message);
    }
});

// Rota: Autenticar usuário por email
router.post('/autenticaremail', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return errorResponse(res, 400, 'E-mail e senha são obrigatórios.');
    }

    try {
        const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (!rows.length || cryptr.decrypt(rows[0].senha) !== senha) {
            return errorResponse(res, 401, 'Credenciais inválidas.');
        }

        const token = jwt.sign({ cpf: rows[0].cpf, tipo: rows[0].tipo }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            message: 'Autenticado com sucesso.',
            token,
            tipo: rows[0].tipo
        });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao autenticar usuário.', error.message);
    }
});

// Rota: Testar autenticação
router.get('/testar-autenticacao', autenticarToken, (req, res) => {
    res.json({ message: 'Autenticação válida.', user: req.user });
});

module.exports = router;
