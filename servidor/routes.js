const express = require('express');
const router = express.Router();
const pool = require('./db');
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey');

const JWT_SECRET = 'your_jwt_secret'; // Substitua por uma chave secreta forte

// Lista de tokens inválidos (em memória)
let invalidTokens = [];

// Rota 1: Cadastrar usuário
router.post('/cadastrar', async (req, res) => {
    const { cpf, email, senha, tipo } = req.body;

    if (!cpf || !email || !senha || !tipo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query(
            'INSERT INTO usuario (cpf, email, senha, tipo) VALUES ($1, $2, $3, $4)',
            [cpf, email, senhaCriptografada, tipo]
        );
        res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar usuário.', details: error.message });
    }
});

// Rota 2: Autenticar usuário
router.post('/autenticar', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ message: 'CPF e senha são obrigatórios.' });
    }

    try {
        const result = await pool.query('SELECT * FROM usuario WHERE cpf = $1', [cpf]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const usuario = result.rows[0];
        const senhaValida = cryptr.decrypt(usuario.senha) === senha;

        if (!senhaValida) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        const token = jwt.sign({ cpf: usuario.cpf, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Autenticado com sucesso.', token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao autenticar usuário.', details: error.message });
    }
});

// Middleware para verificar o token JWT, incluindo a lista de tokens inválidos
const autenticarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    // Verificar se o token está na lista de tokens inválidos
    if (invalidTokens.includes(token)) {
        return res.status(403).json({ message: 'Token inválido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido.' });
        }
        req.user = decoded;
        next();
    });
};

// Rota 3: Testar autenticação
router.get('/testar-autenticacao', autenticarToken, (req, res) => {
    res.json({ message: 'Autenticação válida.', user: req.user });
});

// Rota 4: Desautenticar usuário (invalidar o token)
router.post('/desautenticar', autenticarToken, (req, res) => {
    const token = req.headers['authorization'];

    // Adiciona o token à lista de tokens inválidos
    invalidTokens.push(token);

    res.json({ message: 'Usuário desautenticado com sucesso.' });
});

module.exports = router;
