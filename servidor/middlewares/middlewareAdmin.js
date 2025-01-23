const errorResponse = require('./../ferramentas/errorResponse');

// Middleware para verificar tipo de usuário admin
const verificarAdmin = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return errorResponse(res, 403, 'Acesso restrito a administradores.');
    }
    next();
};

module.exports = verificarAdmin;