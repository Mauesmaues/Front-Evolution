require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CRUD endpoints for notifications
app.get('/notifications', async (req, res) => {
  const { data, error } = await supabase.from('notificaçõesclientes').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/notifications/:id', async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from('notificaçõesclientes').select('*').eq('id', id).single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/notifications', async (req, res) => {
  const { nome, numero } = req.body;
  const { data, error } = await supabase.from('notificaçõesclientes').insert([{ nome, numero }]);
  if (error) return res.status(500).json({ error });
  res.status(201).json(data[0]);
});

app.put('/notifications/:id', async (req, res) => {
  const id = req.params.id;
  const { nome, numero } = req.body;
  const { data, error } = await supabase.from('notificaçõesclientes').update({ nome, numero }).eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

app.delete('/notifications/:id', async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from('notificaçõesclientes').delete().eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json({ deleted: true });
});

// Webhook endpoint called by Make
// Expected body: { id: <notification_id>, message: "text to send", phone_number_id: "<phone_number_resource_id>", token: "<whatsapp_token>" }
app.post('/webhook', async (req, res) => {
  const { id, message, phone_number_id, token } = req.body;
  if (!id || !message || !phone_number_id || !token) return res.status(400).json({ error: 'missing fields' });

  // Lookup notification config (optional)
  const { data: notif, error } = await supabase.from('notificaçõesclientes').select('*').eq('id', id).single();
  if (error) {
    return res.status(500).json({ error });
  }

  // Send message via WhatsApp Cloud API
  const url = `https://graph.facebook.com/v17.0/${phone_number_id}/messages`;
  try {
    const resp = await axios.post(url, {
      messaging_product: 'whatsapp',
      to: notif.numero,
      type: 'text',
      text: { body: message }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.json({ success: true, data: resp.data });
  } catch (err) {
    return res.status(err.response ? err.response.status : 500).json({ success: false, error: err.response ? err.response.data : err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
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
  const publicPaths = ['/login.html', '/login', '/css/login.css', '/js/main.js', '/js/logicaPaineis.js', '/favicon.ico'];
  
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
