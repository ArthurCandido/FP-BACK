const express = require('express');
const router = express.Router();
const pool = require('./db');
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');

const cryptr = new Cryptr('myTotallySecretKey');
const JWT_SECRET = 'your_jwt_secret';
let invalidTokens = [];

// Utilitário para enviar respostas de erro
const errorResponse = (res, status, message, details = null) => 
    res.status(status).json({ message, ...(details && { details }) });

// Middleware para autenticar token JWT
const autenticarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token || invalidTokens.includes(token)) {
        return errorResponse(res, 403, 'Token inválido ou não fornecido.');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return errorResponse(res, 403, 'Token inválido.');
        req.user = decoded;
        next();
    });
};

// Middlewares para verificar tipo de usuário admin
const verificarAdmin = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return errorResponse(res, 403, 'Acesso restrito a administradores.');
    }
    next();
};

// Middlewares para verificar tipo de usuário clt
const verificarClt = (req, res, next) => {
    if (req.user.tipo !== 'clt') {
        return errorResponse(res, 403, 'Acesso restrito a CLTs.');
    }
    next();
};

// Middlewares para verificar tipo de usuário pj
const verificarPj = (req, res, next) => {
    if (req.user.tipo !== 'pj') {
        return errorResponse(res, 403, 'Acesso restrito a PJs.');
    }
    next();
};

//<><><> Rotas Dev

// Rota: Cadastrar usuário
router.post('/dev/user', async (req, res) => {
    const { cpf, email, senha, tipo } = req.body;

    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo) VALUES ($1, $2, $3, $4)', [cpf, email, senhaCriptografada, tipo]);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

//<><><> Rotas usuário

// Rota: Desautenticar usuário
router.post('/user/desautenticar', autenticarToken, (req, res) => {
    invalidTokens.push(req.headers['authorization']);
    res.json({ message: 'Usuário desautenticado com sucesso.' });
});

// Rota: Autenticar usuário
router.post('/user/autenticar', async (req, res) => {
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
        res.json({ message: 'Autenticado com sucesso.', token });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao autenticar usuário.', error.message);
    }
});

// Rota: Testar autenticação
router.get('/user/testar-autenticacao', autenticarToken, (req, res) => {
    res.json({ message: 'Autenticação válida.', user: req.user });
});

//<><><> Rotas administrador

// Rota: Cadastrar holerite
router.post('/admin/holerite', autenticarToken, verificarAdmin, async (req, res) => {
    const { mes, ano, cpf_usuario, caminho_documento } = req.body;

    if (!mes || !ano || !cpf_usuario || !caminho_documento) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        await pool.query(
            'INSERT INTO holerite (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4)', 
            [mes, ano, cpf_usuario, caminho_documento]
        );
        res.status(201).json({ message: 'Holerite cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar holerite.', error.message);
    }
});

// Rota: Listar holerites com filtro
router.get('/admin/holerite', autenticarToken, verificarAdmin, async (req, res) => {
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
router.put('/admin/holerite/:cpf_usuario/:mes/:ano', autenticarToken, verificarAdmin, async (req, res) => {
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
router.delete('/admin/holerite/:cpf_usuario/:mes/:ano', autenticarToken, verificarAdmin, async (req, res) => {
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
router.get('/admin/testar-autenticacao', autenticarToken, verificarAdmin, (req, res) => {
    res.json({ message: 'Autenticação válida para administrador.', user: req.user });
});

// Rota: Cadastrar usuário
router.post('/admin/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, senha, tipo } = req.body;

    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo) VALUES ($1, $2, $3, $4)', [cpf, email, senhaCriptografada, tipo]);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

// Rota: Listar usuários com filtro
router.get('/admin/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, tipo } = req.query;

    let query = 'SELECT cpf, email, tipo FROM usuario';
    const params = [];
    const conditions = [];

    if (cpf) {
        conditions.push('cpf = $' + (params.length + 1));
        params.push(cpf);
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
router.put('/admin/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf } = req.params;
    const { email, senha, tipo } = req.body;

    if (!email && !senha && !tipo) {
        return errorResponse(res, 400, 'Nenhum campo para atualizar foi enviado.');
    }

    const fields = [];
    const params = [];

    if (email) {
        fields.push('email = $' + (params.length + 1));
        params.push(email);
    }
    if (senha) {
        const senhaCriptografada = cryptr.encrypt(senha);
        fields.push('senha = $' + (params.length + 1));
        params.push(senhaCriptografada);
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
router.delete('/admin/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
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

//<><><> Rotas funcionários

//<><><> Rotas CLT

// Rota: Listar holerites com filtro
router.get('/clt/holerite', autenticarToken, verificarClt, async (req, res) => {
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
router.get('/clt/testar-autenticacao', autenticarToken, verificarClt, (req, res) => {
    res.json({ message: 'Autenticação válida para CLT.', user: req.user });
});


//<><><> Rotas PJ

// Rotas: Testar autenticação para PJ
router.get('/pj/testar-autenticacao', autenticarToken, verificarPj, (req, res) => {
    res.json({ message: 'Autenticação válida para PJ.', user: req.user });
});


module.exports = router;
