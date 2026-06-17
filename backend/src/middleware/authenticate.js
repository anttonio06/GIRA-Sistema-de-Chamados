const pool = require('../db/connection');

/**
 * Middleware de autenticacao
 * Verifica sessao valida e confirma no banco que o usuario ainda esta ativo.
 */
async function authenticate(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ erro: 'Nao autenticado. Faca login primeiro.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = ?',
            [req.session.usuario.id]
        );

        const usuario = rows[0];

        if (!usuario || !usuario.ativo) {
            req.session.destroy(() => {});
            return res.status(401).json({ erro: 'Conta desativada ou inexistente.' });
        }

        req.usuario = usuario;
        next();
    } catch (err) {
        console.error('[authenticate]', err);
        return res.status(500).json({ erro: 'Erro interno.' });
    }
}

module.exports = authenticate;
