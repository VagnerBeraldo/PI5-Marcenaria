const { z } = require('zod');

const clienteSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório').max(255),
  logradouro: z.string().min(1, 'O logradouro é obrigatório').max(255),
  numero: z.string().max(20).optional().nullable(),
  complemento: z.string().max(100).optional().nullable(),
  bairro: z.string().max(100).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().length(2, 'O estado deve ter 2 letras').optional().nullable(),
  cep: z.string().max(15).optional().nullable(),
  telefone: z.string().max(20).optional().nullable(),
  email: z.string().email('E-mail inválido').max(255).optional().nullable().or(z.literal('')),
});

module.exports = { clienteSchema };