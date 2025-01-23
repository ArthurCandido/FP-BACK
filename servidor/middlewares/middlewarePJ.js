const errorResponse = require('./../ferramentas/errorResponse');

// Middleware para verificar tipo de usuário pj
const verificarPj = (req, res, next) => {
    if (req.user.tipo !== 'PJ') {
        return errorResponse(res, 403, 'Acesso restrito a PJs.');
    }
    next();
};

module.exports = verificarPj;