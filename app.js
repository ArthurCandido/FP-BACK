const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./rotas');
const swaggerSetup = require('./swagger');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api/', routes);

// Configuração do Swagger
swaggerSetup(app);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});