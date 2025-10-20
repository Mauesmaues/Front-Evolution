require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'evolution_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true se usar HTTPS
}));

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
try {
  const apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes);
  console.log('✅ Rotas da API carregadas com sucesso');
} catch (e) {
  console.error('❌ Erro ao carregar rotas da API:', e.message);
}

// Rota específica para a página de proposta
app.get('/proposta', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/proposta.html'));
});

// Inicializar agendamentos de notificações
try {
  const NotificacaoScheduler = require('./schedulers/NotificacaoScheduler');
  NotificacaoScheduler.iniciarAgendamentos();
  console.log('✅ Agendamentos de notificações iniciados com sucesso');
} catch (e) {
  console.error('❌ Erro ao inicializar agendamentos:', e.message);
}

// Middleware de autenticação para páginas protegidas
app.use((req, res, next) => {
  const publicPaths = ['/login.html', '/login', '/css/login.css', '/js/main.js', '/js/logicaPaineis.js', '/favicon.ico', '/proposta.html', '/proposta'];
  
  if (publicPaths.includes(req.path) || req.path.startsWith('/api') || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/img')) {
    return next();
  }
  
  if (!req.session || !req.session.user) {
    return res.redirect('/login.html');
  }
  
  next();
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Porta ${PORT} já está em uso. Tentando porta ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`Servidor rodando na porta ${PORT + 1}`);
    });
  } else {
    console.error('Erro ao iniciar o servidor:', err);
  }
});
