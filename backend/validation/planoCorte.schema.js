const { z } = require('zod');

// Função para sanitização (remove tags HTML e espaços em branco nas pontas)
const sanitizeHTML = (val) => val.replace(/(<([^>]+)>)/gi, "").trim();

const chapaSchema = z.object({
  id: z.coerce.number(),
  largura: z.coerce.number().positive(),
  altura: z.coerce.number().positive(),
  material: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string())
    .optional()
});

const pecaSchema = z.object({
  id: z.coerce.number(),
  chapaId: z.coerce.number(),
  nome: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string())
    .optional(),
  largura: z.coerce.number().nonnegative(),
  altura: z.coerce.number().nonnegative(),
  qtd: z.coerce.number().int().positive()
});

const criarPlanoSchema = z.object({
  id_orcamento: z.coerce.number().nullable().optional(),
  nome_servico: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string())
    .optional(),
  espessura_serra: z.coerce.number().nonnegative().default(3),
  chapas: z.array(chapaSchema).min(1, "Adicione pelo menos uma chapa."),
  pecas: z.array(pecaSchema).optional().default([])
});

module.exports = { criarPlanoSchema };