const express = require('express');
const pool = require('../db');
const autenticarToken = require('./authMiddleware');
const router = express.Router();



/**
 * @swagger
 * components:
 *   schemas:
 *     NotaFiscal:
 *       type: object
 *       required:
 *         - mes
 *         - ano
 *         - cpf_usuario
 *         - caminho_documento
 *       properties:
 *         mes:
 *           type: integer
 *           description: Mês da nota fiscal
 *         ano:
 *           type: integer
 *           description: Ano da nota fiscal
 *         cpf_usuario:
 *           type: string
 *           description: CPF do usuário
 *         caminho_documento:
 *           type: string
 *           description: Caminho do documento da nota fiscal
 */

/**
 * @swagger
 * /nota_fiscal:
 *   post:
 *     summary: Criação de uma nova nota fiscal
 *     tags: [NotaFiscal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotaFiscal'
 *     responses:
 *       201:
 *         description: Nota fiscal criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotaFiscal'
 *       500:
 *         description: Erro no servidor
 */
router.post('/', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario, caminho_documento } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO nota_fiscal (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4) RETURNING *',
      [mes, ano, cpf_usuario, caminho_documento]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /nota_fiscal:
 *   get:
 *     summary: Leitura de todas as notas fiscais
 *     tags: [NotaFiscal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas as notas fiscais
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotaFiscal'
 *       500:
 *         description: Erro no servidor
 */
router.get('/', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nota_fiscal');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /nota_fiscal/{mes}/{ano}/{cpf_usuario}:
 *   put:
 *     summary: Atualização de uma nota fiscal
 *     tags: [NotaFiscal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mes
 *         schema:
 *           type: integer
 *         required: true
 *         description: Mês da nota fiscal
 *       - in: path
 *         name: ano
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ano da nota fiscal
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
 *             type: object
 *             properties:
 *               caminho_documento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nota fiscal atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotaFiscal'
 *       500:
 *         description: Erro no servidor
 */
router.put('/:mes/:ano/:cpf_usuario', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario } = req.params;
  const { caminho_documento } = req.body;
  try {
    const result = await pool.query(
      'UPDATE nota_fiscal SET caminho_documento = $1 WHERE mes = $2 AND ano = $3 AND cpf_usuario = $4 RETURNING *',
      [caminho_documento, mes, ano, cpf_usuario]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /nota_fiscal/{mes}/{ano}/{cpf_usuario}:
 *   delete:
 *     summary: Exclusão de uma nota fiscal
 *     tags: [NotaFiscal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mes
 *         schema:
 *           type: integer
 *         required: true
 *         description: Mês da nota fiscal
 *       - in: path
 *         name: ano
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ano da nota fiscal
 *       - in: path
 *         name: cpf_usuario
 *         schema:
 *           type: string
 *         required: true
 *         description: CPF do usuário
 *     responses:
 *       204:
 *         description: Nota fiscal excluída com sucesso
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:mes/:ano/:cpf_usuario', autenticarToken, async (req, res) => {
  const { mes, ano, cpf_usuario } = req.params;
  try {
    await pool.query('DELETE FROM nota_fiscal WHERE mes = $1 AND ano = $2 AND cpf_usuario = $3', [mes, ano, cpf_usuario]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;