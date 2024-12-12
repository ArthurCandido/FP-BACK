const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    const token = req.header(process.env.TOKEN_HEADER_KEY);

    if (!token) {
        return res.status(401).json({ error: "Acesso negado: nenhum token providenciado" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = verified; // Attach verified token data to the request
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        res.status(403).json({ error: "Acesso negado: token invalido" });
    }
}

// Create user
router.post("/usuario", authenticateToken, async (req, res) => {
        
    const { cpf, email, senha, tipo } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO usuario (cpf, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING *",
            [cpf, email, senha, tipo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar o usuario:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get("/usuarios", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM usuario");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro na busca dos usuario:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get user by CPF
router.get("/usuario/:cpf", authenticateToken, async (req, res) => {
    const { cpf } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM usuario WHERE usuario.cpf = $1",
            [cpf]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Erro buscando usuario:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put("/usuario/:cpf", authenticateToken, async (req, res) => {
    const { cpf } = req.params;
    const { email, tipo } = req.body;
    try {
        const result = await pool.query(
            "UPDATE usuario SET email = $1, tipo = $2 WHERE usuario.cpf = $3 RETURNING *",
            [email, tipo, cpf]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Erro atualizando usuario:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete("/usuario/:cpf", authenticateToken, async (req, res) => {
    const { cpf } = req.params;
    try {
        await pool.query(
            "DELETE FROM usuario WHERE usuario.cpf = $1",
            [cpf]
        );
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao apagar usuario:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// User login and token generation
router.post("/usuario/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query(
            "SELECT tipo FROM usuario WHERE email = $1 AND senha = $2",
            [email, senha]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
        }

        const tipo = result.rows[0].tipo; 
        const jwtSecretKey = process.env.JWT_SECRET_KEY;
        const data = { userId: email, time: Date.now() };
        const token = jwt.sign(data, jwtSecretKey, { expiresIn: "1h" });

        res.status(200).json({ 'token': token, 'tipo': tipo }); 
    } catch (error) {
        console.error("Erro ao logar:", error.message);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
