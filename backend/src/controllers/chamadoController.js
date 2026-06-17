const pool             = require('../db/connection');
const { registrarLog } = require('../middleware/auditLog');

// POST /api/chamados
const criarChamado = async (req, res) => {
    const { titulo, descricao, categoria, prioridade } = req.body;
    const solicitanteId = req.usuario.id;

    try {
        const [result] = await pool.execute(
            `INSERT INTO chamados (titulo, descricao, categoria, prioridade, solicitante_id)
             VALUES (?, ?, ?, ?, ?)`,
            [titulo, descricao, categoria || null, prioridade || 'media', solicitanteId]
        );
        const chamadoId = result.insertId;

        await pool.execute(
            `INSERT INTO historico_chamado (chamado_id, autor_id, status_anterior, status_novo, observacao)
             VALUES (?, ?, NULL, 'aberto', 'Chamado aberto pelo solicitante.')`,
            [chamadoId, solicitanteId]
        );

        await registrarLog({
            usuarioId: solicitanteId,
            acao: 'CHAMADO_CRIADO',
            entidade: 'chamados',
            entidadeId: chamadoId,
            ip: req.ip,
        });

        res.status(201).json({ mensagem: 'Chamado criado com sucesso.', chamadoId });
    } catch (err) {
        console.error('[criarChamado]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// GET /api/chamados
const listarChamados = async (req, res) => {
    try {
        let query = `
            SELECT c.id, c.titulo, c.status, c.prioridade, c.criado_em,
                   s.nome AS solicitante_nome,
                   r.nome AS responsavel_nome
            FROM chamados c
            JOIN usuarios s ON c.solicitante_id = s.id
            LEFT JOIN usuarios r ON c.responsavel_id = r.id
        `;
        const params = [];

        if (req.usuario.perfil === 'solicitante') {
            query += ' WHERE c.solicitante_id = ?';
            params.push(req.usuario.id);
        } else if (req.usuario.perfil === 'tecnico') {
            query += ' WHERE c.responsavel_id = ?';
            params.push(req.usuario.id);
        }

        query += ' ORDER BY c.criado_em DESC';

        const [chamados] = await pool.execute(query, params);
        res.json(chamados);
    } catch (err) {
        console.error('[listarChamados]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// GET /api/chamados/:id
const buscarChamado = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.execute(`
            SELECT c.*,
                   s.nome AS solicitante_nome,
                   r.nome AS responsavel_nome
            FROM chamados c
            JOIN usuarios s ON c.solicitante_id = s.id
            LEFT JOIN usuarios r ON c.responsavel_id = r.id
            WHERE c.id = ?
        `, [id]);

        if (!rows.length) return res.status(404).json({ erro: 'Chamado não encontrado.' });

        const chamado = rows[0];

        if (req.usuario.perfil === 'solicitante' && chamado.solicitante_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Acesso negado.' });
        }
        if (req.usuario.perfil === 'tecnico' && chamado.responsavel_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Acesso negado.' });
        }

        const [historico] = await pool.execute(`
            SELECT h.*, u.nome AS autor_nome
            FROM historico_chamado h
            JOIN usuarios u ON h.autor_id = u.id
            WHERE h.chamado_id = ?
            ORDER BY h.criado_em ASC
        `, [id]);

        res.json({ ...chamado, historico });
    } catch (err) {
        console.error('[buscarChamado]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// PUT /api/chamados/:id
const atualizarChamado = async (req, res) => {
    const { id } = req.params;
    const { status, responsavel_id, observacao } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM chamados WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ erro: 'Chamado não encontrado.' });

        const chamado = rows[0];

        if (req.usuario.perfil === 'solicitante') {
            return res.status(403).json({ erro: 'Solicitantes não podem alterar chamados por este endpoint.' });
        }
        if (req.usuario.perfil === 'tecnico' && chamado.responsavel_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Chamado não atribuído a você.' });
        }

        const campos = [];
        const params = [];

        if (status && status !== chamado.status) {
            campos.push('status = ?');
            params.push(status);

            await pool.execute(
                `INSERT INTO historico_chamado (chamado_id, autor_id, status_anterior, status_novo, observacao)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, req.usuario.id, chamado.status, status, observacao || `Status alterado para ${status}`]
            );

            await registrarLog({
                usuarioId: req.usuario.id,
                acao: 'CHAMADO_STATUS_ALTERADO',
                entidade: 'chamados',
                entidadeId: id,
                ip: req.ip,
                detalhe: `${chamado.status} → ${status}`,
            });
        }

        if (req.usuario.perfil === 'admin' && responsavel_id !== undefined) {
            campos.push('responsavel_id = ?');
            params.push(responsavel_id);

            await pool.execute(
                `INSERT INTO historico_chamado (chamado_id, autor_id, status_anterior, status_novo, observacao)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, req.usuario.id, chamado.status, chamado.status, `Responsável atribuído: ID ${responsavel_id}`]
            );
        }

        if (observacao && !status) {
            await pool.execute(
                `INSERT INTO historico_chamado (chamado_id, autor_id, status_anterior, status_novo, observacao)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, req.usuario.id, chamado.status, chamado.status, observacao]
            );
        }

        if (campos.length) {
            params.push(id);
            await pool.execute(`UPDATE chamados SET ${campos.join(', ')} WHERE id = ?`, params);
        }

        res.json({ mensagem: 'Chamado atualizado com sucesso.' });
    } catch (err) {
        console.error('[atualizarChamado]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// DELETE /api/chamados/:id  (cancelar — só solicitante dono)
const cancelarChamado = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.execute('SELECT * FROM chamados WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ erro: 'Chamado não encontrado.' });

        const chamado = rows[0];

        if (chamado.solicitante_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Você só pode cancelar seus próprios chamados.' });
        }
        if (['resolvido', 'cancelado'].includes(chamado.status)) {
            return res.status(400).json({ erro: 'Este chamado não pode mais ser cancelado.' });
        }

        await pool.execute("UPDATE chamados SET status = 'cancelado' WHERE id = ?", [id]);
        await pool.execute(
            `INSERT INTO historico_chamado (chamado_id, autor_id, status_anterior, status_novo, observacao)
             VALUES (?, ?, ?, 'cancelado', 'Cancelado pelo solicitante.')`,
            [id, req.usuario.id, chamado.status]
        );

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'CHAMADO_CANCELADO',
            entidade: 'chamados',
            entidadeId: id,
            ip: req.ip,
        });

        res.json({ mensagem: 'Chamado cancelado com sucesso.' });
    } catch (err) {
        console.error('[cancelarChamado]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

module.exports = { criarChamado, listarChamados, buscarChamado, atualizarChamado, cancelarChamado };
