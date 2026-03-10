const { criarPlanoSchema } = require('../validation/planoCorte.schema');
const planoCorteService = require('../services/planoCorteService');

const postPlanoDeCorte = async (req, res) => {
    try {
        // 1. Validação Zod
        const dadosValidados = criarPlanoSchema.parse(req.body);

        // 2. Chama o Service
        const resultado = await planoCorteService.salvarPlanoCompleto(dadosValidados);

        // 3. Resposta de Sucesso (CORRIGIDO: Enviando id_orcamento para o Front)
        res.status(201).json({ 
            message: 'Plano de corte salvo com sucesso!', 
            id_plano: resultado.id_plano,
            id_orcamento: resultado.id_orcamento // <-- Faltava esta linha!
        });

    } catch (err) {
        // Tratamento de erro do Zod
        if (err.name === 'ZodError') {
            return res.status(400).json({ error: 'Erro de validação', detalhes: err.errors });
        }
        
        // Erro do Banco/Servidor
        console.error("Erro ao carregar orçamento", err);
        res.status(500).json({ error: 'Erro interno ao salvar o plano de corte.' });
    }
};

const getPlanos = async (req, res) => {
    try {
        const planos = await planoCorteService.listarPlanos();
        res.status(200).json(planos);
    } catch (error) {
        console.error('Erro ao buscar planos:', error);
        res.status(500).json({ error: 'Erro interno ao buscar planos de corte.' });
    }
};

const putPlanoDeCorte = async (req, res) => {
    try {
        const { id } = req.params;
        const dadosValidados = criarPlanoSchema.parse(req.body);

        await planoCorteService.editarPlanoCompleto(id, dadosValidados);

        res.status(200).json({ message: 'Plano de corte atualizado com sucesso!' });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Erro de validação', detalhes: error.errors });
        }
        console.error('Erro no controller de editar Plano de Corte:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar o plano de corte.' });
    }
};

const deletePlanoDeCorte = async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await planoCorteService.excluirPlano(id);

        if (!deletado) {
            return res.status(404).json({ error: 'Plano não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Erro no controller de exclusão:', error);
        res.status(500).json({ error: 'Erro interno ao excluir o plano.' });
    }
};

const getPlanoPorOrcamento = async (req, res) => {
    try {
        const { id_orcamento } = req.params;
        const plano = await planoCorteService.buscarPlanoPorOrcamento(id_orcamento);
        if (!plano) {
            return res.status(404).json({ error: 'Plano de corte não encontrado para este orçamento.' });
        }
        res.status(200).json(plano);
    } catch (error) {
        console.error('Erro ao buscar plano por orçamento:', error);
        res.status(500).json({ error: 'Erro interno ao buscar plano de corte.' });
    }
};

module.exports = { postPlanoDeCorte, getPlanos, putPlanoDeCorte, deletePlanoDeCorte, getPlanoPorOrcamento };