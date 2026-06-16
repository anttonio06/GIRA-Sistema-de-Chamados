const pool = require('../db/connection');

/**
 * Registra um evento na tabela de auditoria (append-only).
 * Nunca lanca excecao — falha silenciosa para nao interromper o fluxo principal.
 *
 * @param {object} params
 * @param {number}  [params.usuarioId]  - ID do usuario que gerou o evento
 * @param {string}   params.acao        - Ex: 'LOGIN_SUCESSO', 'CHAMADO_CRIADO'
 * @param {string}  [params.entidade]   - Ex: 'chamados'
 * @param {number}  [params.entidadeId] - ID do registro afetado
 * @param {string}  [params.ip]         - IP de origem
 * @param {string}  [params.detalhe]    - Informacao adicional livre
 */
async function registrarLog({ usuarioId = null, acao, entidade = null, entidadeId = null, ip = null, detalhe = null }) {
    try {
          await pool.execute(
                  `INSERT INTO logs_auditoria (usuario_id, acao, entidade, entidade_id, ip, detalhe)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                  [usuarioId, acao, entidade, entidadeId, ip, detalhe]
                );
    } catch (err) {
          console.error('[auditLog] Falha ao registrar log:', err.message);
    }
}

module.exports = { registrarLog };
