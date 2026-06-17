require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('./connection');

const SALT_ROUNDS = 12;

const usuarios = [
  { nome: 'Administrador', email: 'admin@gira.com',       senha: 'Admin@123',    perfil: 'admin'       },
  { nome: 'Tecnico Demo',  email: 'tecnico@gira.com',     senha: 'Tecnico@123',  perfil: 'tecnico'     },
  { nome: 'Solicitante',   email: 'solicitante@gira.com', senha: 'Solici@123',   perfil: 'solicitante' },
  ];

async function seed() {
    for (const u of usuarios) {
          const hash = await bcrypt.hash(u.senha, SALT_ROUNDS);
          await pool.execute(
                  'INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
                  [u.nome, u.email, hash, u.perfil]
                );
          console.log('Inserido:', u.email);
    }
    console.log('Seed concluido.');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
