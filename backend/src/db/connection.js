const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'gira.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'solicitante' CHECK(perfil IN ('solicitante','tecnico','admin')),
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chamados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK(prioridade IN ('baixa','media','alta','urgente')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK(status IN ('aberto','em_andamento','aguardando','resolvido','cancelado')),
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS historico_chamado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chamado_id INTEGER NOT NULL REFERENCES chamados(id),
  autor_id INTEGER NOT NULL REFERENCES usuarios(id),
  status_anterior TEXT,
  status_novo TEXT,
  observacao TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id INTEGER,
  ip TEXT,
  detalhe TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_chamados_atualizado_em
AFTER UPDATE ON chamados
FOR EACH ROW
BEGIN
  UPDATE chamados SET atualizado_em = datetime('now') WHERE id = NEW.id;
END;
`);

const pool = {
  execute: async (sql, params = []) => {
    const isSelect = /^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i.test(sql);

    if (isSelect) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return [rows, []];
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return [{ insertId: Number(result.lastInsertRowid), affectedRows: result.changes }, []];
    }
  },
};

module.exports = pool;
