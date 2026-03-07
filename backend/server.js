const express = require('express');
const cors = require('cors');
const despesasRoutes = require('./routes/despesasRoutes');
const custosRoutes = require('./routes/custosRoutes');
const planoCorteRoutes = require('./routes/planoCorteRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Registro das Rotas
app.use('/api/despesas', despesasRoutes);
app.use('/api/custos', custosRoutes);
app.use('/api/planos-corte', planoCorteRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/clientes', clienteRoutes);

// Rota de status simples
app.get('/api/status', (req, res) => {
  res.json({ status: 'Servidor Express operando' });
});

// Inicialização
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});