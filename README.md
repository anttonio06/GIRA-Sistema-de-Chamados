# GIRA — Sistema de Gestão de Chamados de Manutenção

Projeto acadêmico — **Segurança da Informação** | Centro Universitário Católica de Santa Catarina

---

## Sobre

O **GIRA** é um sistema web seguro para abertura e acompanhamento de chamados de manutenção, com controle de acesso baseado em perfis (RBAC), trilha de auditoria imutável e proteção contra as principais vulnerabilidades OWASP Top 10.

### Stack

| Camada | Tecnologia |
|---|---|
| **Backend** | Node.js + Express + express-session |
| **Banco** | MySQL (mysql2 com prepared statements) |
| **Autenticação** | Sessão com cookie httpOnly + SameSite=strict |
| **Senhas** | bcrypt (custo 12) |
| **Frontend** | React + Vite |
| **Validação** | Zod |

---

## Como rodar localmente

### Pré-requisitos obrigatórios

1. **Node.js 18+** — [nodejs.org](https://nodejs.org)
2. **MySQL rodando** — porta padrão 3306, usuário `root`, senha vazia (ou configure `.env`)
3. **Git** — para clonar o repositório

### Instalação e execução (2 comandos)

```bash
# 1. Clonar e instalar tudo (frontend + backend)
git clone https://github.com/anttonio06/GIRA-Sistema-de-Chamados.git
cd GIRA-Sistema-de-Chamados
npm install

# 2. Iniciar frontend e backend juntos
npm run dev
```

O banco de dados, tabelas e usuários de teste são criados **automaticamente** na primeira execução.

> ⚠️ O MySQL precisa estar rodando antes de `npm run dev`.
> Windows: **Serviços** (`services.msc`) → MySQL → Iniciar

### Acessar o sistema

| URL | Descrição |
|---|---|
| http://localhost:5173 | Frontend (React) |
| http://localhost:3000 | Backend API |

---

## Usuários de teste

| E-mail | Senha | Perfil |
|---|---|---|
| admin@gira.com | Admin@123 | admin |
| tecnico@gira.com | Tecnico@123 | tecnico |
| solicitante@gira.com | Solici@123 | solicitante |

---

## Perfis de acesso (RBAC)

| Perfil | Permissões |
|---|---|
| **solicitante** | Abrir e acompanhar próprios chamados |
| **técnico** | Ver e atualizar chamados atribuídos |
| **admin** | Acesso total + gestão de usuários |

---

## Estrutura do projeto

```
GIRA-Sistema-de-Chamados/
├── package.json          # Workspaces + scripts (npm install / npm run dev)
├── index.html
├── vite.config.js
├── src/                  # Frontend React
│   ├── App.jsx
│   ├── context/AuthContext.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── DetalhesChamado.jsx
│       └── PainelAdmin.jsx
└── backend/
    ├── app.js            # Servidor Express + auto-migration + auto-seed
    ├── package.json
    └── src/
        ├── db/
        │   ├── connection.js   # Pool MySQL
        │   ├── schema.sql      # Referência (não é mais necessário rodar manualmente)
        │   └── seed.js         # Referência (seed automático no app.js)
        ├── middleware/
        │   ├── authenticate.js # Verifica sessão + usuário ativo no banco
        │   ├── authorize.js    # RBAC por perfil (403)
        │   ├── auditLog.js     # Registro append-only em logs_auditoria
        │   └── validate.js     # Validação Zod nos bodies
        ├── routes/
        │   ├── auth.js         # POST /login, POST /logout, GET /me
        │   ├── chamados.js     # CRUD chamados
        │   ├── usuarios.js     # Gestão de usuários (admin)
        │   └── auditoria.js    # Consulta de logs (admin)
        ├── controllers/
        │   ├── chamadoController.js
        │   ├── usuarioController.js
        │   └── auditController.js
        └── validators/
            └── index.js        # Schemas Zod
```

---

## Controles de segurança implementados

- **Senhas** armazenadas com bcrypt (custo 12) — nunca em texto puro
- **Sessão** com cookie `httpOnly` + `SameSite=strict` (proteção XSS/CSRF)
- **Prepared statements** em todas as queries (prevenção SQL Injection)
- **RBAC** em cada rota — perfil verificado antes de executar
- **Revalidação de sessão** — usuário verificado no banco a cada requisição
- **Tabelas de auditoria append-only** (`logs_auditoria`, `historico_chamado`)
- **Mensagens de erro genéricas** no login (sem vazamento de informação)
- **Validação de entrada** com Zod em todos os endpoints

---

## Referências

- OWASP Top 10 (2021)
- ISO/IEC 27001:2022 — A.8.15 Logging
- NIST SP 800-162 (ABAC/RBAC Guide)
