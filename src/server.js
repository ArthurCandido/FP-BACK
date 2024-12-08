require("dotenv").config();
const express = require("express");
const funcRouter = require("./func/func");
const app = express();

app.use(express.json());
app.use("", funcRouter);

const PORT = 12345;

app.listen(PORT, () => {
   console.log("Servidor rodando na porta " + PORT);
});
