const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    const token = req.header(process.env.TOKEN_HEADER_KEY);

    if (!token) {
        return res.status(401).json({ error: "Access Denied: No token provided" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = verified; // Attach verified token data to the request
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        res.status(403).json({ error: "Access Denied: Invalid token" });
    }
}

// Middleware to check if the user is an admin
function checkAdmin(req, res, next) {
    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ error: "Access Denied: Admins only" });
    }
    next();
}

// Create user (only admin)
router.post("/usuario", authenticateToken, checkAdmin, async (req, res) => {
    const { cpf, email, senha, tipo } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            "INSERT INTO usuario (cpf, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING *",
            [cpf, email, hashedPassword, tipo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar o usuario:", error.message);
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

// User login and token generation
router.post("/usuario/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM usuario WHERE email = $1",
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(senha, user.senha);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create and send JWT token
        const jwtSecretKey = process.env.JWT_SECRET_KEY;
        const data = { userId: email, tipo: user.tipo, time: Date.now() };
        const token = jwt.sign(data, jwtSecretKey, { expiresIn: "1h" });

        res.status(200).json({ token });
    } catch (error) {
        console.error("Erro ao logar:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;