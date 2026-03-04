const despesasService = require('../services/despesasService');
const { z } = require('zod');

// Schema de Validação Estrita
const itemSchema = z.object({
  id: z.number(),
  nome: z.string().trim().min(1, "Nome não pode ser vazio").max(255, "Nome muito longo"), 
  valor: z.number().min(0, "Valor não pode ser negativo")
});

const despesasSchema = z.object({
  faturamento: z.number().min(0),
  despesasFixas: z.object({
    manutencao: z.number().min(0),
    internet: z.number().min(0),
    contador: z.number().min(0),
    outrasFixas: z.array(itemSchema)
  }),
  despesasVariaveis: z.object({
    energia: z.number().min(0),
    impostoPerc: z.number().min(0),
    taxaCartaoPerc: z.number().min(0),
    fornecedores: z.number().min(0),
    outrasVariaveis: z.array(itemSchema)
  })
});

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
    // Valida o payload de entrada
    const validacao = despesasSchema.safeParse(req.body);
    
    if (!validacao.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos ou mal formatados.', 
        detalhes: validacao.error.format() 
      });
    }

    // Passa para o service APENAS os dados que foram validados pelo Zod
    const resultado = await despesasService.salvarDespesas(validacao.data);
    res.status(201).json({ message: 'Despesas criadas com sucesso', id: resultado.id_despesa });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao salvar despesas' });
  }
};

const putDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Valida o payload de entrada
    const validacao = despesasSchema.safeParse(req.body);
    
    if (!validacao.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos ou mal formatados.', 
        detalhes: validacao.error.format() 
      });
    }

    await despesasService.atualizarDespesas(id, validacao.data);
    res.status(200).json({ message: 'Despesas atualizadas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar despesas' });
  }
};

const deleteDespesas = async (req, res) => {
  try {
    const { id } = req.params;
    await despesasService.excluirDespesas(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao excluir despesas' });
  }
};

module.exports = { getDespesas, postDespesas, putDespesas, deleteDespesas };