const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                erro: 'Erro de validação',
                detalhes: err.errors.map(e => e.message),
            });
        }
        next(err);
    }
};

module.exports = { validate };
