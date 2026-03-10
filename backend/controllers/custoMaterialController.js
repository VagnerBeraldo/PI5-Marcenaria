const custoMaterialService = require('../services/custoMaterialService');
const { custoProjetoSchema } = require('../validation/custo.schema'); 

const getCusto = async (req, res) => {
  try {
    const payload = await custoMaterialService.obterCustos();
    res.json(payload);
  } catch (error) {
    console.error("Erro ao carregar orçamento", error);
    res.status(500).json({ error: 'Erro interno ao buscar projetos.' });
  }
};

const postCusto = async (req, res) => {
  try {
    const validacao = custoProjetoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: validacao.error.format() });
    }
    const resultado = await custoMaterialService.salvarCusto(validacao.data);
    res.status(201).json({ 
      message: 'Projeto criado com sucesso', 
      id_projeto: resultado.id_projeto,
      id_orcamento: resultado.id_orcamento
    });
  } catch (error) {
    console.error("Erro ao carregar orçamento", error);
    res.status(500).json({ error: 'Erro interno ao salvar projeto.' });
  }
};

const putCusto = async (req, res) => {
  try {
    const { id } = req.params;
    const validacao = custoProjetoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: validacao.error.format() });
    }
    await custoMaterialService.atualizarCusto(id, validacao.data);
    res.status(200).json({ message: 'Projeto atualizado com sucesso' });
  } catch (error) {
    console.error("Erro ao carregar orçamento", error);
    res.status(500).json({ error: 'Erro interno ao atualizar projeto.' });
  }
};

const deleteCusto = async (req, res) => {
  try {
    const { id } = req.params;
    await custoMaterialService.excluirCusto(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao carregar orçamento", error);
    res.status(500).json({ error: 'Erro interno ao excluir projeto.' });
  }
};

const getCustoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const custo = await custoMaterialService.obterCustoPorId(id);
        if (!custo) {
            return res.status(404).json({ error: 'Ficha técnica não encontrada.' });
        }
        res.status(200).json(custo);
    } catch (error) {
        console.error("Erro ao carregar orçamento", error);
        res.status(500).json({ error: 'Erro interno ao buscar ficha técnica.' });
    }
};

module.exports = { getCusto, postCusto, putCusto, deleteCusto, getCustoPorId };