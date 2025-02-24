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
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-44", "func1@email.com", cryptr.encrypt("password"), "CLT", "Univaldo"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-45", "func2@email.com", cryptr.encrypt("password"), "CLT", "Ana ;-;"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-46", "func3@email.com", cryptr.encrypt("password"), "CLT", "Linda"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-47", "func4@email.com", cryptr.encrypt("password"), "CLT", "Isabela"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-48", "func5@email.com", cryptr.encrypt("password"), "CLT", "Fernanda"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-49", "func6@email.com", cryptr.encrypt("password"), "CLT", "Osvaldo"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-54", "funcf1@email.com", cryptr.encrypt("password"), "PJ", "Ricardo"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-55", "funcf2@email.com", cryptr.encrypt("password"), "PJ", "Carol"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-56", "funcf3@email.com", cryptr.encrypt("password"), "PJ", "Bete"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-57", "funcf4@email.com", cryptr.encrypt("password"), "PJ", "Camila"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-58", "funcf5@email.com", cryptr.encrypt("password"), "PJ", "Fernando Junior"]);
      await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', ["111.222.333-59", "funcf6@email.com", cryptr.encrypt("password"), "PJ", "Arnaldo"]);
      console.log('Usuário ' + nome + ' cadastrado com sucesso');
    } catch (queryErr) {
      console.log('Erro ao inserir usuário ' + nome);
    }
    release();
  }
});

module.exports = pool;
