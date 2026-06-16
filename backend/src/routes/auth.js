const express  = require('express');
const bcrypt   = require('bcrypt');
const router   = express.Router();
const pool     = require('../db/connection');
const authenticate     = require('../middleware/authenticate');
const { registrarLog } = require('../middleware/auditLog');

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const ip = req.ip;

              if (!email || !senha) {
                    return res.status(400).json({ erro: 'E-mail e senha sao obrigatorios.' });
              }

              try {
                    const [rows] = await pool.execute(
                            'SELECT id, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = ?',
                            [email]
                          );

      const usuario = rows[0];

      if (!usuario || !usuario.ativo) {
              await registrarLog({ acao: 'LOGIN_FALHA', ip, detalhe: `Email tentado: ${email}` });
              return res.status(401).json({ erro: 'Credenciais invalidas.' });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

      if (!senhaCorreta) {
              await registrarLog({ usuarioId: usuario.id, acao: 'LOGIN_FALHA', ip, detalhe: 'Senha incorreta' });
              return res.status(401).json({ erro: 'Credenciais invalidas.' });
      }

      req.session.usuario = {
              id:     usuario.id,
              nome:   usuario.nome,
              email:  usuario.email,
              perfil: usuario.perfil,
      };

      await registrarLog({ usuarioId: usuario.id, acao: 'LOGIN_SUCESSO', ip });

      return res.json({
              mensagem: 'Login realizado com sucesso.',
              usuario:  req.session.usuario,
      });
              } catch (err) {
                    console.error('[auth/login]', err);
                    return res.status(500).json({ erro: 'Erro interno do servidor.' });
              }
});

// POST /auth/logout
router.post('/logout', authenticate, (req, res) => {
    const usuarioId = req.usuario.id;
    const ip = req.ip;

              req.session.destroy(async (err) => {
                    if (err) return res.status(500).json({ erro: 'Erro ao encerrar sessao.' });
                    res.clearCookie('connect.sid');
                    await registrarLog({ usuarioId, acao: 'LOGOUT', ip });
                    return res.json({ mensagem: 'Logout realizado com sucesso.' });
              });
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
    return res.json({ usuario: req.usuario });
});

module.exports = router;
