const express = require('express');
const bodyParser = require('body-parser');
const produtoRoutes = require('./routes');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api/produtos', produtoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
