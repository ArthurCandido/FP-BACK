const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const autenticarToken = require('./authMiddleware');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_jwt_secret';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - cpf
 *         - email
 *         - senha
 *         - tipo
 *         - nome
 *       properties:
 *         cpf:
 *           type: string
 *           description: CPF do usuário
 *         email:
 *           type: string
 *           description: Email do usuário
 *         senha:
 *           type: string
 *           description: Senha do usuário
 *         tipo:
 *           type: string
 *           description: Tipo de usuário
 *         nome:
 *           type: string
 *           description: Nome do usuário
 */

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gerenciamento de usuários
 */

/**
 * @swagger
 * /usuario:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       500:
 *         description: Erro ao criar usuário
 */
router.post('/', async (req, res) => {
  const { cpf, email, senha, tipo, nome } = req.body;
  const hashedPassword = await bcrypt.hash(senha, 10);
  try {
    const result = await pool.query(
      'INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [cpf, email, hashedPassword, tipo, nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /usuario/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
 *       401:
 *         description: Senha incorreta
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao autenticar usuário
 */
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(senha, user.senha);
      if (match) {
        const token = jwt.sign({ cpf: user.cpf, tipo: user.tipo }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Autenticação bem-sucedida', token });
      } else {
        res.status(401).json({ message: 'Senha incorreta' });
      }
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /usuario:
 *   get:
 *     summary: Retorna todos os usuários
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       500:
 *         description: Erro ao buscar usuários
 */
router.get('/', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /usuario/{cpf}:
 *   put:
 *     summary: Atualiza um usuário
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       500:
 *         description: Erro ao atualizar usuário
 */
router.put('/:cpf', autenticarToken, async (req, res) => {
  const { cpf } = req.params;
  const { email, senha, tipo, nome } = req.body;
  const hashedPassword = await bcrypt.hash(senha, 10);
  try {
    const result = await pool.query(
      'UPDATE usuario SET email = $1, senha = $2, tipo = $3, nome = $4 WHERE cpf = $5 RETURNING *',
      [email, hashedPassword, tipo, nome, cpf]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /usuario/{cpf}:
 *   delete:
 *     summary: Exclui um usuário
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     responses:
 *       204:
 *         description: Usuário excluído com sucesso
 *       500:
 *         description: Erro ao excluir usuário
 */
router.delete('/:cpf', autenticarToken, async (req, res) => {
  const { cpf } = req.params;
  try {
    await pool.query('DELETE FROM usuario WHERE cpf = $1', [cpf]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;