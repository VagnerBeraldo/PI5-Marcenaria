const { z } = require('zod');

// Função para sanitização (remove tags HTML e espaços em branco nas pontas)
const sanitizeHTML = (val) => val.replace(/(<([^>]+)>)/gi, "").trim();

const clienteSchema = z.object({
  nome: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, 'O nome é obrigatório').max(255)),
    
  logradouro: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, 'O logradouro é obrigatório').max(255)),
    
  numero: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(20))
    .optional().nullable(),
    
  complemento: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100))
    .optional().nullable(),
    
  bairro: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100))
    .optional().nullable(),
    
  cidade: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100))
    .optional().nullable(),
    
  estado: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().length(2, 'O estado deve ter 2 letras'))
    .optional().nullable(),
    
  cep: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(15))
    .optional().nullable(),
    
  telefone: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(20))
    .optional().nullable(),
    
  email: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().email('E-mail inválido').max(255).or(z.literal('')))
    .optional().nullable(),
});

module.exports = { clienteSchema };