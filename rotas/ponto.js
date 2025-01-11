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
 *     Ponto:
 *       type: object
 *       required:
 *         - horario
 *         - cpf_usuario
 *         - entrada_saida
 *       properties:
 *         horario:
 *           type: string
 *           format: date-time
 *           description: Horário do ponto
 *         cpf_usuario:
 *           type: string
 *           description: CPF do usuário
 *         entrada_saida:
 *           type: boolean
 *           description: Indica se é entrada ou saída
 */

/**
 * @swagger
 * tags:
 *   name: Pontos
 *   description: Gerenciamento de pontos
 */

/**
 * @swagger
 * /ponto:
 *   post:
 *     summary: Cria um novo ponto
 *     tags: [Pontos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ponto'
 *     responses:
 *       201:
 *         description: Ponto criado com sucesso
 *       500:
 *         description: Erro ao criar ponto
 */
router.post('/', autenticarToken, async (req, res) => {
  const { horario, cpf_usuario, entrada_saida } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO ponto (horario, cpf_usuario, entrada_saida) VALUES ($1, $2, $3) RETURNING *',
      [horario, cpf_usuario, entrada_saida]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ponto:
 *   get:
 *     summary: Retorna todos os pontos
 *     tags: [Pontos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pontos
 *       500:
 *         description: Erro ao buscar pontos
 */
router.get('/', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ponto');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ponto/{horario}/{cpf_usuario}:
 *   put:
 *     summary: Atualiza um ponto
 *     tags: [Pontos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horario
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Horário do ponto
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
 *             $ref: '#/components/schemas/Ponto'
 *     responses:
 *       200:
 *         description: Ponto atualizado com sucesso
 *       500:
 *         description: Erro ao atualizar ponto
 */
router.put('/:horario/:cpf_usuario', autenticarToken, async (req, res) => {
  const { horario, cpf_usuario } = req.params;
  const { entrada_saida } = req.body;
  try {
    const result = await pool.query(
      'UPDATE ponto SET entrada_saida = $1 WHERE horario = $2 AND cpf_usuario = $3 RETURNING *',
      [entrada_saida, horario, cpf_usuario]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ponto/{horario}/{cpf_usuario}:
 *   delete:
 *     summary: Exclui um ponto
 *     tags: [Pontos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horario
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Horário do ponto
 *       - in: path
 *         name: cpf_usuario
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     responses:
 *       204:
 *         description: Ponto excluído com sucesso
 *       500:
 *         description: Erro ao excluir ponto
 */
router.delete('/:horario/:cpf_usuario', autenticarToken, async (req, res) => {
  const { horario, cpf_usuario } = req.params;
  try {
    await pool.query('DELETE FROM ponto WHERE horario = $1 AND cpf_usuario = $2', [horario, cpf_usuario]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;