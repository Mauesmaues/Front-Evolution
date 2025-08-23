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
  const publicPaths = ['/login.html', '/login', '/css/login.css', '/js/main.js', '/js/logicaPaineis.js'];
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

// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  // Aqui você deve validar o usuário no banco (exemplo simplificado)
  // Substitua por consulta real ao banco
  if (email === 'admin@admin.com' && senha === '123456') {
    req.session.user = { email };
    return res.json({ sucesso: true });
  }
  // Exemplo: buscar usuário real no banco
  // const usuario = await buscarUsuarioNoBanco(email, senha);
  // if (usuario) { req.session.user = usuario; return res.json({ sucesso: true }); }
  res.json({ sucesso: false, mensagem: 'Credenciais inválidas' });
});

// Rota de logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
