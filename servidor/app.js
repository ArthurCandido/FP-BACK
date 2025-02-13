const express = require('express');
const bodyParser = require('body-parser');
//const rotasUser = require('./rotas/rotasUser');
//const rotasDev = require('./rotas/rotasDev');
//const rotasAdmin = require('./rotas/rotasAdmin');
//const rotasCLT = require('./rotas/rotasCLT');
//const rotasPJ = require('./rotas/rotasPJ');
const rotasDevUser = require("./rotas/Dev/rotasDevUser");
const rotasAdminUser = require("./rotas/Admin/rotasAdminUser");
const rotasUserAuth = require("./rotas/User/rotasUserAuth");

const app = express();
const PORT = 3000;

// Middleware para logar as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

app.use('/api/dev', rotasDevUser);
app.use('/api/user', rotasUserAuth);
app.use('/api/admin', rotasAdminUser);
//app.use('/api/user', rotasUser);
//app.use('/api/dev', rotasDev);
//app.use('/api/admin', rotasAdmin);
//app.use('/api/clt', rotasCLT);
//app.use('/api/pj', rotasPJ);

// Middleware para capturar erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
