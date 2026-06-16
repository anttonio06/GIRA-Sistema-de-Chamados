-- GIRA -- Schema do Banco de Dados
CREATE DATABASE IF NOT EXISTS gira_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gira_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('solicitante','tecnico','admin') NOT NULL DEFAULT 'solicitante',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chamados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(100),
  prioridade ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  status ENUM('aberto','em_andamento','aguardando','resolvido','cancelado') NOT NULL DEFAULT 'aberto',
  solicitante_id INT NOT NULL,
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS historico_chamado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chamado_id INT NOT NULL,
  autor_id INT NOT NULL,
  status_anterior ENUM('aberto','em_andamento','aguardando','resolvido','cancelado'),
  status_novo ENUM('aberto','em_andamento','aguardando','resolvido','cancelado'),
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chamado_id) REFERENCES chamados(id),
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(50),
  entidade_id INT,
  ip VARCHAR(45),
  detalhe TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
