# GR Marcenaria

Sistema de gestão operacional e financeira desenvolvido para microempreendedores individuais (MEI), como projeto integrador do 5º semestre do curso de TDAS, Senac Santo Amaro, para o setor de marcenaria. O software centraliza a precificação técnica, controle de custos operacionais e otimização de matéria-prima.

## 🛠 Stack Tecnológico

**Frontend (SPA):**
* React 19 + Vite
* React Router DOM (Roteamento de interface)
* Framer Motion (Transições e animações de UI)
* Zod (Validação estrita de schemas)
* Axios (Client HTTP)

**Backend (API REST):**
* Node.js + Express 5
* MySQL2 (Driver de conexão)
* Zod (Validação de payload)
* Cors & Dotenv

**Banco de Dados:**
* MySQL 8.x (Modelagem relacional)

## ⚙️ Funcionalidades (MVP)

* **Gestão Financeira:** Controle de despesas fixas/variáveis e cálculo automatizado do Ponto de Equilíbrio (Break-even).
* **Plano de Corte (Nesting):** Otimização da distribuição de peças em chapas de MDF, visando a mitigação de desperdício de material.
* **Orçamentação:** Precificação técnica considerando margem de lucro, insumos e impostos, com geração de proposta comercial em PDF.
* **Gestão de Clientes:** Cadastro integrado à API ViaCEP.

## 🚀 Como Executar o Projeto

A arquitetura de inicialização utiliza `concurrently` no diretório raiz para orquestrar os serviços do backend e frontend de forma simultânea. O script de inicialização do backend já engatilha o setup do banco de dados via `init-db.js`.

### 1. Instalação das dependências
Execute a instalação na raiz do projeto e nos respectivos microsserviços:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configuração de Variáveis de Ambiente
No diretório `backend`, crie um arquivo `.env` parametrizando a conexão com o banco de dados MySQL:
```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=gr_marcenaria_db
PORT=3000
```

### 3. Inicialização
Retorne à raiz do projeto e dispare o ambiente de desenvolvimento:
```bash
npm run dev
```
*Nota arquitetural: O comando acima executará automaticamente o script `predev` (`node init-db.js`) no backend antes de iniciar a escuta com `nodemon`. Em paralelo, o servidor Vite do frontend será provisionado.*
