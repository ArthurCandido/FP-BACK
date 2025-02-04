const express = require('express');
const router = express.Router();
const pool = require('../db');
const errorResponse = require('./../ferramentas/errorResponse');
const verificarAdmin = require('../middlewares/middlewareAdmin');
const autenticarToken = require('../middlewares/middlewareUser');

// Rota: Cadastrar holerite
router.post('/holerite', autenticarToken, verificarAdmin, async (req, res) => {
    const { mes, ano, cpf_usuario, caminho_documento } = req.body;

    if (!mes || !ano || !cpf_usuario || !caminho_documento) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const userCadastrado = await pool.query("SELECT * FROM usuario WHERE cpf = $1 AND tipo = 'CLT'", [cpf_usuario]);
        if(userCadastrado.rowCount === 0) {
            return errorResponse(res, 404, 'Usuário não cadastrado no sistema ou não é CLT.');
        }

        await pool.query(
            'INSERT INTO holerite (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4)', 
            [mes, ano, cpf_usuario, caminho_documento]
        );
        res.status(200).json({ message: 'Holerite cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar holerite.', error.message);
    }
});

// Rota: Listar holerites com filtro
router.get('/holerite', autenticarToken, verificarAdmin, async (req, res) => {
    const { mes, ano, cpf_usuario } = req.query;

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

// Rota: Alterar holerite
router.put('/holerite/:cpf_usuario/:mes/:ano', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_usuario, mes, ano } = req.params;
    const { caminho_documento } = req.body;

    if (!caminho_documento) {
        return errorResponse(res, 400, 'O campo caminho_documento é obrigatório.');
    }

    try {
        const result = await pool.query(
            'UPDATE holerite SET caminho_documento = $1 WHERE cpf_usuario = $2 AND mes = $3 AND ano = $4', 
            [caminho_documento, cpf_usuario, mes, ano]
        );
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Holerite não encontrado.');
        }
        res.status(200).json({ message: 'Holerite atualizado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao atualizar holerite.', error.message);
    }
});

// Rota: Remover holerite
router.delete('/holerite/:cpf_usuario/:mes/:ano', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_usuario, mes, ano } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM holerite WHERE cpf_usuario = $1 AND mes = $2 AND ano = $3', 
            [cpf_usuario, mes, ano]
        );
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Holerite não encontrado.');
        }
        res.status(200).json({ message: 'Holerite removido com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao remover holerite.', error.message);
    }
});

// Rotas: Testar autenticação para administrador
router.get('/testar-autenticacao', autenticarToken, verificarAdmin, (req, res) => {
    res.json({ message: 'Autenticação válida para administrador.', user: req.user });
});

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