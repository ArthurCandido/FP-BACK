const { Pool } = require('pg');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey');

const pool = new Pool({
  user: 'postgres',         
  host: 'localhost',            
  database: 'gabi',
  password: 'password',        
  port: 54320,                   
});

const cpf = "000.000.000-00";
const email = "email@email.com";
const senha = "password";
const tipo = "admin";
const nome = "Chefe";

pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('Conexão bem-sucedida com o banco de dados');
    try {
      const senhaCriptografada = cryptr.encrypt(senha);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', [cpf, email, senhaCriptografada, tipo, nome]);
      console.log('Usuário ' + nome + ' cadastrado com sucesso');
    } catch (queryErr) {
      console.log('Erro ao inserir usuário ' + nome);
    }
    release();
  }
});

module.exports = pool;
