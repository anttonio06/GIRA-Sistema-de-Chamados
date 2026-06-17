const pool = require('../db/connection');

// GET /api/auditoria
const listarLogs = async (req, res) => {
    try {
        const [logs] = await pool.execute(`
            SELECT l.*, u.nome AS usuario_nome, u.email AS usuario_email
            FROM logs_auditoria l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            ORDER BY l.criado_em DESC
            LIMIT 500
        `);
        res.json(logs);
    } catch (err) {
        console.error('[listarLogs]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

module.exports = { listarLogs };
