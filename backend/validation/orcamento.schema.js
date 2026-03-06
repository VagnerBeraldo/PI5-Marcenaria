const { z } = require('zod');

const orcamentoSchema = z.object({
    id_cliente: z.number().int().positive().nullable().optional(),
    id_projeto: z.number().int().positive().nullable().optional(),
    nome_projeto: z.string().trim().min(1, "O nome do projeto é obrigatório."),
    quantidade: z.coerce.number().int().min(1, "Quantidade mínima é 1."),
    dias_trabalho: z.coerce.number().int().min(0),
    valor_custo: z.coerce.number().min(0),
    imposto_importacao: z.coerce.number().min(0),
    frete: z.coerce.number().min(0),
    custo_fixo: z.coerce.number().min(0),
    energia_eletrica: z.coerce.number().min(0),
    imposto: z.coerce.number().min(0),
    taxa_cartao: z.coerce.number().min(0),
    margem_lucro: z.coerce.number().min(0),
    preco_sugerido: z.coerce.number().min(0),
    preco_final_impresso: z.coerce.number().min(0),
    adiantamento: z.coerce.number().min(0).optional().default(0),
    extras: z.array(z.object({
        descricao: z.string().trim().min(1, "A descrição da despesa extra é obrigatória."),
        valor: z.coerce.number().min(0)
    })).optional().default([])
});

module.exports = { orcamentoSchema };