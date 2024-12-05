const express = require('express');
const router = express.Router();
const pool = require('./db');

// Criar produto
router.post('/', async (req, res) => {
  const {descricao, preco, estoque, data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produto (descricao, preco, estoque, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [descricao, preco, estoque, data]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ error: 'Erro ao adicionar produto', details: error.message });
  }
});

// Listar produtos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, descricao, estoque, preco FROM produto ORDER BY estoque DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Recuperar produto
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM produto WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Arualizar produto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {descricao, preco, estoque, data } = req.body;
  try {
    const result = await pool.query(
      'UPDATE produto SET descricao = $1, preco = $2, estoque = $3, data = $4 WHERE id = $5 RETURNING *',
      [descricao, preco, estoque, data, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM produto WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;
