const express = require('express');
const pool = require('../db');
const autenticarToken = require('./authMiddleware');
const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Documento:
 *       type: object
 *       required:
 *         - nome
 *         - cpf_usuario
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do documento
 *         cpf_usuario:
 *           type: string
 *           description: CPF do usuário
 */

/**
 * @swagger
 * tags:
 *   name: Documentos
 *   description: Gerenciamento de documentos
 */

/**
 * @swagger
 * /documento:
 *   post:
 *     summary: Cria um novo documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Documento'
 *     responses:
 *       201:
 *         description: Documento criado com sucesso
 *       500:
 *         description: Erro ao criar documento
 */
router.post('/', autenticarToken, async (req, res) => {
  const { nome, cpf_usuario } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO documento (nome, cpf_usuario) VALUES ($1, $2) RETURNING *',
      [nome, cpf_usuario]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /documento:
 *   get:
 *     summary: Retorna todos os documentos
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos
 *       500:
 *         description: Erro ao buscar documentos
 */
router.get('/', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documento');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /documento/{caminho}:
 *   put:
 *     summary: Atualiza um documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caminho
 *         schema:
 *           type: integer
 *         required: true
 *         description: Caminho do documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Documento'
 *     responses:
 *       200:
 *         description: Documento atualizado com sucesso
 *       500:
 *         description: Erro ao atualizar documento
 */
router.put('/:caminho', autenticarToken, async (req, res) => {
  const { caminho } = req.params;
  const { nome, cpf_usuario } = req.body;
  try {
    const result = await pool.query(
      'UPDATE documento SET nome = $1, cpf_usuario = $2 WHERE caminho = $3 RETURNING *',
      [nome, cpf_usuario, caminho]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /documento/{caminho}:
 *   delete:
 *     summary: Exclui um documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caminho
 *         schema:
 *           type: integer
 *         required: true
 *         description: Caminho do documento
 *     responses:
 *       204:
 *         description: Documento excluído com sucesso
 *       500:
 *         description: Erro ao excluir documento
 */
router.delete('/:caminho', autenticarToken, async (req, res) => {
  const { caminho } = req.params;
  try {
    await pool.query('DELETE FROM documento WHERE caminho = $1', [caminho]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;