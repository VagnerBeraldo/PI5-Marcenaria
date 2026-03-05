const custoMaterialService = require('../services/custoMaterialService');
const { z } = require('zod');

// Schema do Item individual
const materialItemSchema = z.object({
  material: z.string().trim().min(1, "Nome do material é obrigatório"),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unidade_medida: z.string().trim().min(1, "Unidade é obrigatória"),
  valor_unitario: z.coerce.number().min(0, "Valor não pode ser negativo")
});

// Schema do Projeto (Payload completo)
const custoProjetoSchema = z.object({
  nome_projeto: z.string().trim().min(1, "Nome do projeto é obrigatório"),
  mao_de_obra: z.coerce.number().min(0).optional().default(0),
  instalacao: z.coerce.number().min(0).optional().default(0),
  materiais: z.array(materialItemSchema).min(1, "Insira pelo menos um material na tabela.")
});

const getCusto = async (req, res) => {
  try {
    const payload = await custoMaterialService.obterCustos();
    res.json(payload);
  } catch (error) {
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
    res.status(201).json({ message: 'Projeto criado com sucesso', id: resultado.id_projeto });
  } catch (error) {
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
    res.status(500).json({ error: 'Erro interno ao atualizar projeto.' });
  }
};

const deleteCusto = async (req, res) => {
  try {
    const { id } = req.params;
    await custoMaterialService.excluirCusto(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao excluir projeto.' });
  }
};

module.exports = { getCusto, postCusto, putCusto, deleteCusto };