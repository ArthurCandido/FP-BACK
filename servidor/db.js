const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',         
  host: 'localhost',            
  database: 'gabi',
  password: 'password',        
  port: 54320,                   
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('Conexão bem-sucedida com o banco de dados');
    release();
  }
});

module.exports = pool;
