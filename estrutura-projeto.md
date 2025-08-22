# Estrutura do Projeto: dashboard-project

Este documento explica a organização de pastas e arquivos do projeto, detalhando o tipo de arquivo e sua funcionalidade em cada diretório.

## backend/
Servidor Express responsável por servir a API (se houver) ou apenas o frontend estático.
- **routes/**: Pasta para rotas da API. Caso o projeto possua endpoints próprios, eles devem ser definidos aqui.
  - `api.js`: Arquivo opcional que define as rotas da API.
- `server.js`: Arquivo principal do servidor Express. Responsável por inicializar o servidor e configurar middlewares, rotas e servir arquivos estáticos.
- `.env`: Arquivo de variáveis de ambiente, como portas, credenciais e configurações sensíveis.

## public/
Frontend estático do dashboard, contendo arquivos HTML, CSS, JS e imagens.
- **css/**: Pasta para arquivos de estilos.
  - `styles.css`: Folha de estilos principal do dashboard.
- **js/**: Pasta para scripts JavaScript.
  - `main.js`: Script principal para consumir a API e atualizar a interface do usuário.
- **img/**: Pasta para imagens utilizadas no dashboard.
- `index.html`: Página principal do dashboard, estrutura base do frontend.

## logs/
Pasta opcional para armazenar logs de execução do servidor, como erros, acessos ou eventos importantes.

## package.json
Arquivo de configuração do Node.js, contendo dependências, scripts e metadados do projeto.

## package-lock.json
Arquivo gerado automaticamente para travar as versões das dependências instaladas.

## README.md
Documento de apresentação e instruções do projeto, incluindo informações de instalação, uso e estrutura.

---

**Resumo:**
- O diretório `backend/` centraliza o servidor Express e rotas da API.
- O diretório `public/` contém todo o frontend estático.
- O diretório `logs/` é opcional e serve para registro de eventos do servidor.
- Os arquivos `package.json` e `package-lock.json` gerenciam dependências do Node.js.
- O `README.md` documenta o projeto e sua estrutura.
