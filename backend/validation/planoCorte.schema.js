const { z } = require('zod');

const chapaSchema = z.object({
  id: z.number(),
  largura: z.number().positive(),
  altura: z.number().positive(),
  material: z.string().optional()
});

const pecaSchema = z.object({
  id: z.number(),
  chapaId: z.number(),
  nome: z.string().optional(),
  largura: z.number().nonnegative(),
  altura: z.number().nonnegative(),
  qtd: z.number().int().positive()
});

const criarPlanoSchema = z.object({
  id_orcamento: z.number().nullable().optional(),
  nome_servico: z.string().optional(),
  espessura_serra: z.number().nonnegative().default(3),
  chapas: z.array(chapaSchema).min(1, "Adicione pelo menos uma chapa."),
  pecas: z.array(pecaSchema).optional().default([])
});

module.exports = { criarPlanoSchema };