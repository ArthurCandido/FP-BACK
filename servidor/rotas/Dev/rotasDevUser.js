const express = require('express');
const router = express.Router();
const pool = require('../../db');
const errorResponse = require('../../ferramentas/errorResponse');
const {cryptr, JWT_SECRET, invalidTokens} = require('../../variaveis/variaveisUser');

// Rota: Cadastrar usuário
router.post('/user', async (req, res) => {
    const { cpf, email, senha, tipo, nome} = req.body;

    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5    )', [cpf, email, senhaCriptografada, tipo, nome]);
        res.status(200).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

module.exports = router;