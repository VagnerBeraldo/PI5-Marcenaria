const { criarPlanoSchema } = require('./planoCorte.schema');
const planoCorteService = require('./planoCorteService');

const criarPlano = async (req, res) => {
    try {
        // 1. Validação Zod
        const dadosValidados = criarPlanoSchema.parse(req.body);

        // 2. Chama o Service
        const resultado = await planoCorteService.salvarPlanoCompleto(dadosValidados);

        // 3. Resposta de Sucesso
        res.status(201).json({ message: 'Plano de corte salvo com sucesso!', id_plano: resultado.id_plano });

    } catch (error) {
        // Tratamento de erro do Zod
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Erro de validação', detalhes: error.errors });
        }
        
        // Erro do Banco/Servidor
        console.error('Erro no controller de Plano de Corte:', error);
        res.status(500).json({ error: 'Erro interno ao salvar o plano de corte.' });
    }
};

module.exports = { criarPlano };