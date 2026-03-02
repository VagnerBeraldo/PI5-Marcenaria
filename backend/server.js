const express = require('express');
const cors = require('cors');
const despesasRoutes = require('./routes/despesasRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Registro das Rotas
app.use('/api/despesas', despesasRoutes);

// Rota de status simples
app.get('/api/status', (req, res) => {
  res.json({ status: 'Servidor Express operando' });
});

// Inicialização
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});