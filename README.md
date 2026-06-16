# GIRA - Sistema de Gestao de Chamados de Manutencao

> Projeto academico — Seguranca da Informacao | Centro Universitario Catolica de Santa Catarina
>
> ## Sobre
>
> O GIRA e um sistema web seguro para abertura e acompanhamento de chamados de manutencao, com controle de acesso baseado em perfis (RBAC), trilha de auditoria imutavel e protecao contra as principais vulnerabilidades OWASP Top 10.
>
> ## Stack
>
> - **Backend:** Node.js + Express + express-session
> - - **Banco:** MySQL (mysql2 com prepared statements)
>   - - **Autenticacao:** Sessao com cookie httpOnly + SameSite=strict
>     - - **Senhas:** bcrypt (custo 12)
>       - - **Frontend:** React + Vite *(em desenvolvimento)*
>        
>         - ## Perfis de acesso (RBAC)
>        
>         - | Perfil | Permissoes |
>         - |---|---|
>         - | `solicitante` | Abrir e acompanhar proprios chamados |
> | `tecnico` | Ver e atualizar chamados atribuidos |
> | `admin` | Acesso total + gestao de usuarios |
>
> ## Estrutura do projeto
>
> ```
> backend/
>   app.js                      # Servidor Express (sessao, CORS, rotas)
>   package.json
>   .env.example                # Variaveis de ambiente (nunca versionar .env real)
>   src/
>     db/
>       schema.sql              # Criacao das 4 tabelas
>       connection.js           # Pool MySQL
>       seed.js                 # 3 usuarios de teste
>     middleware/
>       authenticate.js         # Verifica sessao valida (401)
>       authorize.js            # RBAC por perfil (403)
>       auditLog.js             # Registro append-only na tabela logs_auditoria
>     routes/
>       auth.js                 # POST /login, POST /logout, GET /me
> ```
>
> ## Como rodar localmente
>
> ```bash
> # 1. Clonar
> git clone https://github.com/anttonio06/GIRA-Sistema-de-Chamados.git
> cd GIRA-Sistema-de-Chamados/backend
>
> # 2. Instalar dependencias
> npm install
>
> # 3. Configurar variaveis de ambiente
> copy .env.example .env
> # Edite .env com suas credenciais MySQL
>
> # 4. Criar o banco e tabelas
> mysql -u root -p < src/db/schema.sql
>
> # 5. Popular usuarios de teste
> npm run seed
>
> # 6. Iniciar
> npm run dev
> # API disponivel em http://localhost:3001
> ```
>
> ## Usuarios de teste
>
> | Email | Senha | Perfil |
> |---|---|---|
> | admin@gira.com | Admin@123 | admin |
> | tecnico@gira.com | Tecnico@123 | tecnico |
> | solicitante@gira.com | Solici@123 | solicitante |
>
> ## Controles de seguranca implementados
>
> - Senhas armazenadas com bcrypt (custo 12) — nunca em texto puro
> - - Sessao com cookie `httpOnly` + `SameSite=strict` (protecao XSS/CSRF)
>   - - Prepared statements em todas as queries (prevencao SQL Injection)
>     - - RBAC: cada rota verifica perfil antes de executar
>       - - Tabelas de auditoria append-only (`logs_auditoria`, `historico_chamado`)
>         - - Mensagens de erro genericas no login (sem vazamento de informacao)
>          
>           - ## Referencias
>          
>           - - OWASP Top 10 (2021)
>             - - ISO/IEC 27001:2022 — A.8.15 Logging
>               - - NIST SP 800-162 (ABAC/RBAC Guide)
