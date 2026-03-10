const clienteService = require('../services/clienteService');
const { clienteSchema } = require('../validation/cliente.schema');

const listar = async (req, res) => {
  try {
    const clientes = await clienteService.getClientes();
    res.json(clientes);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
};

const criar = async (req, res) => {
  try {
    const dadosValidados = clienteSchema.parse(req.body);
    const id = await clienteService.createCliente(dadosValidados);
    res.status(201).json({ id, ...dadosValidados }); 
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Erro de validação', detalhes: error.errors });
    }
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const dadosValidados = clienteSchema.parse(req.body);
    const affectedRows = await clienteService.updateCliente(req.params.id, dadosValidados);
    if (affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Erro de validação', detalhes: error.errors });
    }
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
};

const remover = async (req, res) => {
  try {
    const affectedRows = await clienteService.deleteCliente(req.params.id);
    if (affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error("Erro ao remover cliente:", error);
    res.status(500).json({ error: 'Erro ao remover cliente.' });
  }
};

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover
};