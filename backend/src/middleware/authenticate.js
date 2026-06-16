/**
 * Middleware de autenticacao
 * Verifica se existe uma sessao valida; caso contrario retorna 401.
 */
function authenticate(req, res, next) {
    if (!req.session || !req.session.usuario) {
          return res.status(401).json({ erro: 'Nao autenticado. Faca login primeiro.' });
    }
    req.usuario = req.session.usuario;
    next();
}

module.exports = authenticate;
