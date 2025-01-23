const errorResponse = require('./../ferramentas/errorResponse');

// Middleware para verificar tipo de usuário clt
const verificarClt = (req, res, next) => {
    if (req.user.tipo !== 'CLT') {
        return errorResponse(res, 403, 'Acesso restrito a CLTs.');
    }
    next();
};

module.exports = verificarClt;