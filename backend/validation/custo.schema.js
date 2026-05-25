const { z } = require('zod');

// Função para sanitização (remove tags HTML e espaços em branco nas pontas)
const sanitizeHTML = (val) => val.replace(/(<([^>]+)>)/gi, "").trim();

// Schema do Item individual
const materialItemSchema = z.object({
  material: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, "Nome do material é obrigatório")),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unidade_medida: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, "Unidade é obrigatória")),
  valor_unitario: z.coerce.number().min(0, "Valor não pode ser negativo")
});

// Schema do Projeto (Payload completo)
const custoProjetoSchema = z.object({
  id_orcamento: z.coerce.number().nullable().optional(),
  nome_projeto: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, "Nome do projeto é obrigatório")),
  mao_de_obra: z.coerce.number().min(0).optional().default(0),
  instalacao: z.coerce.number().min(0).optional().default(0),
  materiais: z.array(materialItemSchema).optional().default([])
});

module.exports = {
  materialItemSchema,
  custoProjetoSchema
};