const express = require('express');
const pool = require('../db');
const router = express.Router();
const autenticarToken = require('./authMiddleware');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Holerite:
 *       type: object
 *       required:
 *         - mes
 *         - ano
 *         - cpf_usuario
 *         - caminho_documento
 *       properties:
 *         mes:
 *           type: integer
 *           description: Mês do holerite
 *         ano:
 *           type: integer
 *           description: Ano do holerite
 *         cpf_usuario:
 *           type: string
 *           description: CPF do usuário
 *         caminho_documento:
 *           type: integer
 *           description: Caminho do documento
 */

/**
 * @swagger
 * tags:
 *   name: Holerites
 *   description: Gerenciamento de holerites
 */

/**
 * @swagger
 * /holerite:
 *   post:
 *     summary: Cria um novo holerite
 *     tags: [Holerites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Holerite'
 *     responses:
 *       201:
 *         description: Holerite criado com sucesso
 *       500:
 *         description: Erro ao criar holerite
 */
router.post('/', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario, caminho_documento } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO holerite (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4) RETURNING *',
      [mes, ano, cpf_usuario, caminho_documento]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /holerite:
 *   get:
 *     summary: Retorna todos os holerites
 *     tags: [Holerites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de holerites
 *       500:
 *         description: Erro ao buscar holerites
 */
router.get('/', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holerite');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /holerite/{mes}/{ano}/{cpf_usuario}:
 *   put:
 *     summary: Atualiza um holerite
 *     tags: [Holerites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mes
 *         schema:
 *           type: integer
 *         required: true
 *         description: Mês do holerite
 *       - in: path
 *         name: ano
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ano do holerite
 *       - in: path
 *         name: cpf_usuario
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Holerite'
 *     responses:
 *       200:
 *         description: Holerite atualizado com sucesso
 *       500:
 *         description: Erro ao atualizar holerite
 */
router.put('/:mes/:ano/:cpf_usuario', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario } = req.params;
  const { caminho_documento } = req.body;
  try {
    const result = await pool.query(
      'UPDATE holerite SET caminho_documento = $1 WHERE mes = $2 AND ano = $3 AND cpf_usuario = $4 RETURNING *',
      [caminho_documento, mes, ano, cpf_usuario]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /holerite/{mes}/{ano}/{cpf_usuario}:
 *   delete:
 *     summary: Exclui um holerite
 *     tags: [Holerites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mes
 *         schema:
 *           type: integer
 *         required: true
 *         description: Mês do holerite
 *       - in: path
 *         name: ano
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ano do holerite
 *       - in: path
 *         name: cpf_usuario
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     responses:
 *       204:
 *         description: Holerite excluído com sucesso
 *       500:
 *         description: Erro ao excluir holerite
 */
router.delete('/:mes/:ano/:cpf_usuario', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario } = req.params;
  try {
    await pool.query('DELETE FROM holerite WHERE mes = $1 AND ano = $2 AND cpf_usuario = $3', [mes, ano, cpf_usuario]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;