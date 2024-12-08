require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const createDatabase = async () => {
   const pool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: "postgres",
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
   });

   try {
      await pool.connect();
      const database = process.env.PGDATABASE;
      const response = await pool.query(
         `SELECT 1 FROM pg_database WHERE datname = $1`,
         [database],
      );

      if (response.rowCount === 0) {
         await pool.query(`CREATE DATABASE "${database}"`);
         console.log(
            `Database "${database} criada com sucesso"`,
         );
      } else {
         console.log(`Database já existe`);
      }
   } catch (error) {
      console.log(error.message);
   }
};

const pool1 = new Pool({
   user: process.env.PGUSER,
   host: process.env.PGHOST,
   database: process.env.PGDATABASE,
   password: process.env.PGPASSWORD,
   port: process.env.PGPORT,
});

const runSingleScript = async (filepath) => {
   const script = fs.readFileSync(path.join(__dirname, filepath)).toString();
   try {
      await pool1.connect();
      await pool1.query(script);
      console.log("Funcionou");
   } catch (error) {
      console.error("Erro no script : ${filepath} :", error.message);
   }
};

const runScripts = async () => {
   await createDatabase();
   await runSingleScript("./db/CREATEDATABASE");
   await runSingleScript("./db/CREATEADMIN");
};

runScripts();

module.exports = pool1;
