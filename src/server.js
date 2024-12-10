const express = require("express");
const app = express();
const pool = require("./db");
const funcRoutes = require("./routes/func");

app.use(express.json());
app.use("/api", funcRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log(`Servidor rodando na porta ${PORT}`);
});