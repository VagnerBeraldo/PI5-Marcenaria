const { z } = require("zod");
const orcamentoService = require("../services/orcamentoService");
const { orcamentoSchema } = require("../validation/orcamento.schema");

const postOrcamento = async (req, res) => {
  try {
    const dadosValidados = orcamentoSchema.parse(req.body);
    const resultado = await orcamentoService.salvarOrcamento(dadosValidados);

    res
      .status(201)
      .json({
        id: resultado.id_orcamento,
        id_cliente: resultado.id_cliente,
        message: "Orçamento salvo com sucesso!",
      });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Erro de validação", detalhes: err.errors });
    }
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: "Erro interno ao salvar orçamento." });
  }
};

const getOrcamentos = async (req, res) => {
  try {
    const orcamentos = await orcamentoService.listarOrcamentos();
    res.status(200).json(orcamentos);
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: "Erro interno ao buscar orçamentos." });
  }
};

const putOrcamento = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosValidados = orcamentoSchema.parse(req.body);
    await orcamentoService.editarOrcamento(id, dadosValidados);
    res.status(200).json({ message: "Orçamento atualizado com sucesso!" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Erro de validação", detalhes: err.errors });
    }
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: "Erro interno ao atualizar orçamento." });
  }
};

const deleteOrcamento = async (req, res) => {
  try {
    const { id } = req.params;
    const deletado = await orcamentoService.excluirOrcamento(id);

    if (!deletado) {
      return res.status(404).json({ error: "Orçamento não encontrado." });
    }

    res.status(204).end();
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res.status(500).json({ error: "Erro interno ao excluir orçamento." });
  }
};

const getOrcamentosPorCliente = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const orcamentos =
      await orcamentoService.buscarOrcamentosPorCliente(id_cliente);
    res.status(200).json(orcamentos);
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    res
      .status(500)
      .json({ error: "Erro interno ao buscar orçamentos do cliente." });
  }
};

module.exports = {
  postOrcamento,
  getOrcamentos,
  putOrcamento,
  deleteOrcamento,
  getOrcamentosPorCliente,
};