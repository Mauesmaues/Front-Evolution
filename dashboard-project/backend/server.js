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

// Middleware de autenticação para páginas protegidas
app.use((req, res, next) => {
  const publicPaths = ['/login.html', '/login', '/css/login.css', '/js/main.js', '/js/logicaPaineis.js', '/api/login'];
  if (publicPaths.includes(req.path) || req.path.startsWith('/api')) {
    return next();
  }
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  next();
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));


app.use(express.json());

// Rotas da API (opcional)
try {
  const apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes);
} catch (e) {
  // Se não houver rotas, ignora
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
