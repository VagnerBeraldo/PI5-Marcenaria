const despesasService = require('../services/despesasService');

const getDespesas = async (req, res) => {
  try {
    const payload = await despesasService.obterDespesaAtual();
    if (!payload) return res.status(404).json({ message: 'Nenhuma despesa encontrada' });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao buscar despesas' });
  }
};

const postDespesas = async (req, res) => {
  try {
    const dados = req.body;
    if (dados.faturamento === undefined) return res.status(400).json({ error: 'Dados incompletos.' });
    const resultado = await despesasService.salvarDespesas(dados);
    res.status(201).json({ message: 'Despesas criadas com sucesso', id: resultado.id_despesa });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao salvar despesas' });
  }
};

const putDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    await despesasService.atualizarDespesas(id, dados);
    res.status(200).json({ message: 'Despesas atualizadas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar despesas' });
  }
};

const deleteDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    await despesasService.excluirDespesas(id);
    res.status(200).json({ message: 'Despesas excluídas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao excluir despesas' });
  }
};

module.exports = { getDespesas, postDespesas, putDespesas, deleteDespesas };