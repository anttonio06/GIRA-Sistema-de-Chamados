/**
 * Middleware de autorizacao baseado em perfil (RBAC)
 * Uso: router.get('/rota', authenticate, authorize('admin', 'tecnico'), handler)
 */
function authorize(...perfisPermitidos) {
    return (req, res, next) => {
          if (!req.usuario) {
                  return res.status(401).json({ erro: 'Nao autenticado.' });
          }
          if (!perfisPermitidos.includes(req.usuario.perfil)) {
                  return res.status(403).json({ erro: 'Acesso negado. Perfil sem permissao.' });
          }
          next();
    };
}

module.exports = authorize;
