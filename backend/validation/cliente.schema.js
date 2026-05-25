const { z } = require('zod');

const sanitizeHTML = (val) => val.replace(/(<([^>]+)>)/gi, "").trim();

const clienteSchema = z.object({
  nome: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().min(1, 'O nome é obrigatório').max(255)),
    
  logradouro: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(255).or(z.literal('')))
    .optional().nullable(),
    
  numero: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(20).or(z.literal('')))
    .optional().nullable(),
    
  complemento: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100).or(z.literal('')))
    .optional().nullable(),
    
  bairro: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100).or(z.literal('')))
    .optional().nullable(),
    
  cidade: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(100).or(z.literal('')))
    .optional().nullable(),
    
  estado: z.string()
    .transform(sanitizeHTML)
    .transform(val => val === '' ? undefined : val) // Força undefined se vazio
    .pipe(z.string().length(2, 'O estado deve ter exatas 2 letras').optional()),
    
  cep: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(15).or(z.literal('')))
    .optional().nullable(),
    
  telefone: z.string()
    .transform(sanitizeHTML)
    .pipe(z.string().max(20).or(z.literal('')))
    .optional().nullable(),
    
  email: z.string()
    .transform(sanitizeHTML)
    .transform(val => val === '' ? undefined : val) // Força undefined se vazio
    .pipe(z.string().email('E-mail inválido').max(255).optional()),
});

module.exports = { clienteSchema };