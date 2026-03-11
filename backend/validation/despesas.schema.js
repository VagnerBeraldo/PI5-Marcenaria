const { z } = require('zod');

// Função para sanitização (remove tags HTML e espaços em branco nas pontas)
const sanitizeHTML = (val) => val.replace(/(<([^>]+)>)/gi, "").trim();

// Schema de Validação com Coerção e Sanitização
const itemSchema = z.object({
  id: z.coerce.number(),
  nome: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, "Nome não pode ser vazio").max(255, "Nome muito longo")), 
  valor: z.coerce.number().min(0, "Valor não pode ser negativo")
});

const despesasSchema = z.object({
  faturamento: z.coerce.number().min(0),
  despesasFixas: z.object({
    manutencao: z.coerce.number().min(0),
    internet: z.coerce.number().min(0),
    contador: z.coerce.number().min(0),
    outrasFixas: z.array(itemSchema)
  }),
  despesasVariaveis: z.object({
    energia: z.coerce.number().min(0),
    impostoPerc: z.coerce.number().min(0),
    taxaCartaoPerc: z.coerce.number().min(0),
    fornecedores: z.coerce.number().min(0),
    outrasVariaveis: z.array(itemSchema)
  })
});

module.exports = { despesasSchema };