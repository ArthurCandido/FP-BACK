const express = require('express');
const usuarioRoutes = require('./usuario');
const documentoRoutes = require('./documento');
const pontoRoutes = require('./ponto');
const holeriteRoutes = require('./holerite');
const notaFiscalRoutes = require('./nota_fiscal');

const router = express.Router();

router.use('/usuario', usuarioRoutes);
router.use('/documento', documentoRoutes);
router.use('/ponto', pontoRoutes);
router.use('/holerite', holeriteRoutes);
router.use('/nota_fiscal', notaFiscalRoutes);

module.exports = router;