const express = require('express');
const router = express.Router();
const pool = require('../../db');
const errorResponse = require('../../ferramentas/errorResponse');
const verificarAdmin = require('../../middlewares/middlewareAdmin');
const autenticarToken = require('../../middlewares/middlewareUser');

// Rota: Cadastrar usuário
router.post('/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, senha, nome, tipo } = req.body;

    
    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', [cpf, email, senhaCriptografada, tipo, nome]);
        res.status(200).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

// Rota: Listar usuários com filtro
router.get('/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, tipo, nome } = req.query;

    let query = 'SELECT cpf, email, tipo, nome FROM usuario';
    const params = [];
    const conditions = [];

    if (cpf) {
        conditions.push('cpf = $' + (params.length + 1));
        params.push(cpf);
    }
    if(nome){
        conditions.push('nome = $' + (params.length + 1));
        params.push(`%${nome}%`);
    }
    if (email) {
        conditions.push('email ILIKE $' + (params.length + 1));
        params.push(`%${email}%`);
    }
    if (tipo) {
        conditions.push('tipo = $' + (params.length + 1));
        params.push(tipo);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar usuários.', error.message);
    }
});

// Rota: Alterar usuário
router.put('/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf } = req.params;
    const { email, nome, tipo } = req.body;

    if (!email && !nome && !tipo) {
        return errorResponse(res, 400, 'Nenhum campo para atualizar foi enviado.');
    }

    const fields = [];
    const params = [];

    if (email) {
        fields.push('email = $' + (params.length + 1));
        params.push(email);
    }
    if(nome){
        fields.push('nome = $' + (params.length + 1));
        params.push(nome);
    }
    if (tipo) {
        fields.push('tipo = $' + (params.length + 1));
        params.push(tipo);
    }

    params.push(cpf);
    const query = `UPDATE usuario SET ${fields.join(', ')} WHERE cpf = $${params.length}`;

    try {
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Usuário não encontrado.');
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao atualizar usuário.', error.message);
    }
});

// Rota: Remover usuário
router.delete('/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf } = req.params;

    try {
        const result = await pool.query('DELETE FROM usuario WHERE cpf = $1', [cpf]);
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Usuário não encontrado.');
        }
        res.status(200).json({ message: 'Usuário removido com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao remover usuário.', error.message);
    }
});

module.exports = router;