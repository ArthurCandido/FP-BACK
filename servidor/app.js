const express = require('express');
const bodyParser = require('body-parser');
const rotasUser = require('./rotas/rotasUser');
const rotasDev = require('./rotas/rotasDev');
const rotasAdmin = require('./rotas/rotasAdmin');
const rotasCLT = require('./rotas/rotasCLT');
const rotasPJ = require('./rotas/rotasPJ');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api/user', rotasUser);
app.use('/api/dev', rotasDev);
app.use('/api/admin', rotasAdmin);
app.use('/api/clt', rotasCLT);
app.use('/api/pj', rotasPJ);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
