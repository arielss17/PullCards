const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    // Log unexpected errors
    if (err.statusCode === 500) {
        console.error('💥 Server Error:', err);
    }

    res.status(err.statusCode).json({
        error: err.isOperational ? err.message : 'Erro interno no servidor. Contate os Arquimagos.'
    });
};

module.exports = errorHandler;
