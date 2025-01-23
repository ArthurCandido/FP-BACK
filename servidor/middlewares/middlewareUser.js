const {cryptr, JWT_SECRET, invalidTokens} = require('../variaveis/variaveisUser');
const errorResponse = require('./../ferramentas/errorResponse');
const jwt = require('jsonwebtoken');

// Middleware para autenticar token JWT
const autenticarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token || invalidTokens.includes(token)) {
        return errorResponse(res, 403, 'Token inválido ou não fornecido.');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return errorResponse(res, 403, 'Token inválido.');
        req.user = decoded;
        next();
    });
};

module.exports = autenticarToken;