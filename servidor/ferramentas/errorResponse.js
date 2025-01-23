// Utilitário para enviar respostas de erro
const errorResponse = (res, status, message, details = null) => 
    res.status(status).json({ message, ...(details && { details }) });

module.exports = errorResponse;