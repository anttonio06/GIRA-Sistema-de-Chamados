require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcrypt');

const DB_HOST = process.env.DB_HOST     || 'localhost';
const DB_PORT = process.env.DB_PORT     || 3306;
const DB_USER = process.env.DB_USER     || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME     || 'gira_db';

// ---------------------------------------------------------------------------
// Auto-migration: cria banco, tabelas e usuários se ainda não existirem
// ---------------------------------------------------------------------------
async function initDB() {
    console.log('[DB] Verificando banco de dados...');

    // 1. Cria o banco (conexão sem banco especificado)
    let conn;
    try {
        conn = await mysql.createConnection({
            host: DB_HOST, port: DB_PORT,
            user: DB_USER, password: DB_PASS,
        });
        await conn.execute(
            `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        if (conn) await conn.end();
    }

    // 2. Cria tabelas (pool já aponta para gira_db)
    const pool = require('./src/db/connection');

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            nome       VARCHAR(100)  NOT NULL,
            email      VARCHAR(150)  NOT NULL UNIQUE,
            senha_hash VARCHAR(255)  NOT NULL,
            perfil     ENUM('solicitante','tecnico','admin') NOT NULL DEFAULT 'solicitante',
            ativo      BOOLEAN       NOT NULL DEFAULT TRUE,
            criado_em  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS chamados (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            titulo         VARCHAR(200) NOT NULL,
            descricao      TEXT         NOT NULL,
            categoria      VARCHAR(100),
            prioridade     ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
            status         ENUM('aberto','em_andamento','aguardando','resolvido','cancelado') NOT NULL DEFAULT 'aberto',
            solicitante_id INT NOT NULL,
            responsavel_id INT,
            criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
            FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS historico_chamado (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            chamado_id      INT NOT NULL,
            autor_id        INT NOT NULL,
            status_anterior ENUM('aberto','em_andamento','aguardando','resolvido','cancelado'),
            status_novo     ENUM('aberto','em_andamento','aguardando','resolvido','cancelado'),
            observacao      TEXT,
            criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chamado_id) REFERENCES chamados(id),
            FOREIGN KEY (autor_id)   REFERENCES usuarios(id)
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS logs_auditoria (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id  INT,
            acao        VARCHAR(100) NOT NULL,
            entidade    VARCHAR(50),
            entidade_id INT,
            ip          VARCHAR(45),
            detalhe     TEXT,
            criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);

    // 3. Seed: insere usuários de demo se a tabela estiver vazia
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM usuarios');
    if (total === 0) {
        console.log('[DB] Inserindo usuários de demonstração...');
        const usuarios = [
            { nome: 'Administrador', email: 'admin@gira.com',       senha: 'Admin@123',   perfil: 'admin'       },
            { nome: 'Tecnico Demo',  email: 'tecnico@gira.com',     senha: 'Tecnico@123', perfil: 'tecnico'     },
            { nome: 'Solicitante',   email: 'solicitante@gira.com', senha: 'Solici@123',  perfil: 'solicitante' },
        ];
        for (const u of usuarios) {
            const hash = await bcrypt.hash(u.senha, 12);
            await pool.execute(
                'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
                [u.nome, u.email, hash, u.perfil]
            );
        }
    }

    console.log('[DB] Banco pronto.');
}

// ---------------------------------------------------------------------------
// Inicia servidor apenas depois que o banco estiver configurado
// ---------------------------------------------------------------------------
async function main() {
    try {
        await initDB();
    } catch (err) {
        console.error('\n[ERRO] Falha ao conectar ao MySQL:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('→ O MySQL não está rodando.');
            console.error('  Windows: abra Serviços (services.msc) → MySQL → Iniciar\n');
        }
        process.exit(1);
    }

    const authRoutes      = require('./src/routes/auth');
    const chamadosRoutes  = require('./src/routes/chamados');
    const usuariosRoutes  = require('./src/routes/usuarios');
    const auditoriaRoutes = require('./src/routes/auditoria');

    const app  = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors({
        origin:      process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    }));

    app.use(express.json());

    app.use(session({
        secret:            process.env.SESSION_SECRET || 'troca_antes_de_usar',
        resave:            false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'strict',
            maxAge:   1000 * 60 * 60 * 8,
        },
    }));

    app.use('/api/auth',      authRoutes);
    app.use('/api/chamados',  chamadosRoutes);
    app.use('/api/usuarios',  usuariosRoutes);
    app.use('/api/auditoria', auditoriaRoutes);

    app.get('/', (_req, res) => res.json({ status: 'GIRA API online', versao: '0.2.0' }));

    app.listen(PORT, () => {
        console.log(`\n✅  GIRA API rodando em http://localhost:${PORT}`);
        console.log('    Usuários de acesso:');
        console.log('      admin@gira.com       / Admin@123');
        console.log('      tecnico@gira.com     / Tecnico@123');
        console.log('      solicitante@gira.com / Solici@123\n');
    });
}

main();
