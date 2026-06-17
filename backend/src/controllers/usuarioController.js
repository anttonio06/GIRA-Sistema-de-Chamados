const bcrypt           = require('bcrypt');
const pool             = require('../db/connection');
const { registrarLog } = require('../middleware/auditLog');

// GET /api/usuarios
const listarUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome ASC'
        );
        res.json(usuarios);
    } catch (err) {
        console.error('[listarUsuarios]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// POST /api/usuarios
const criarUsuario = async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 12);
        await pool.execute(
            'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, perfil]
        );

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'USUARIO_CRIADO',
            entidade: 'usuarios',
            ip: req.ip,
            detalhe: `Usuário ${email} criado com perfil ${perfil}`,
        });

        res.status(201).json({ mensagem: 'Usuário criado com sucesso.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'E-mail já está em uso.' });
        }
        console.error('[criarUsuario]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// PUT /api/usuarios/:id/ativo
const alterarAtivo = async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;

    try {
        await pool.execute('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, id]);

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'USUARIO_ALTERADO',
            entidade: 'usuarios',
            entidadeId: id,
            ip: req.ip,
            detalhe: `ativo = ${ativo}`,
        });

        res.json({ mensagem: 'Usuário atualizado com sucesso.' });
    } catch (err) {
        console.error('[alterarAtivo]', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

module.exports = { listarUsuarios, criarUsuario, alterarAtivo };
