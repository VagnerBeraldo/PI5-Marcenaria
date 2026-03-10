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
  id_orcamento: z.coerce.number().nullable().optional(),
  nome_projeto: z.string().trim().min(1, "Nome do projeto é obrigatório"),
  mao_de_obra: z.coerce.number().min(0).optional().default(0),
  instalacao: z.coerce.number().min(0).optional().default(0),
  materiais: z.array(materialItemSchema).min(1, "Insira pelo menos um material na tabela.")
});

module.exports = {
  materialItemSchema,
  custoProjetoSchema
};