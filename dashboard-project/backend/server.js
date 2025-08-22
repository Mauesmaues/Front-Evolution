require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path = require('path');
const app = express();

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
