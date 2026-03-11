const despesasService = require('../services/despesasService');
const { despesasSchema } = require('../validation/despesas.schema');

const getDespesas = async (req, res) => {
  try {
    const payload = await despesasService.obterDespesaAtual();
    if (!payload) return res.status(404).json({ message: 'Nenhuma despesa encontrada' });
    res.json(payload);
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: 'Erro interno no servidor ao buscar despesas' });
  }
};

const postDespesas = async (req, res) => {
  try {
    const validacao = despesasSchema.safeParse(req.body);
    
    if (!validacao.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos ou mal formatados.', 
        detalhes: validacao.error.format() 
      });
    }

    const resultado = await despesasService.salvarDespesas(validacao.data);
    res.status(201).json({ message: 'Despesas criadas com sucesso', id: resultado.id_despesa });
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: 'Erro interno no servidor ao salvar despesas' });
  }
};

const putDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const validacao = despesasSchema.safeParse(req.body);
    
    if (!validacao.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos ou mal formatados.', 
        detalhes: validacao.error.format() 
      });
    }

    await despesasService.atualizarDespesas(id, validacao.data);
    res.status(200).json({ message: 'Despesas atualizadas com sucesso' });
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar despesas' });
  }
};

const deleteDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    await despesasService.excluirDespesas(id);
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: 'Erro interno no servidor ao excluir despesas' });
  }
};

module.exports = { getDespesas, postDespesas, putDespesas, deleteDespesas };