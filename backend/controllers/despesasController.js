const despesasService = require('../services/despesasService');

const getDespesas = async (req, res) => {
  try {
    const payload = await despesasService.obterDespesaAtual();
    
    if (!payload) {
      return res.status(404).json({ message: 'Nenhuma despesa encontrada' });
    }

    res.json(payload);
  } catch (error) {
    console.error('Erro no controller de despesas:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao buscar despesas' });
  }
};

const postDespesas = async (req, res) => {
  try {
    const dados = req.body;
    
    // Validação básica do payload
    if (dados.faturamento === undefined) {
      return res.status(400).json({ error: 'Os dados da requisição estão incompletos.' });
    }

    const resultado = await despesasService.salvarDespesas(dados);
    
    // Retorna 201 (Created) em caso de sucesso
    res.status(201).json({ 
      message: 'Despesas criadas com sucesso', 
      id: resultado.id_despesa 
    });
  } catch (error) {
    console.error('Erro ao salvar despesas:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao salvar despesas' });
  }
};

module.exports = {
  getDespesas,
  postDespesas
};