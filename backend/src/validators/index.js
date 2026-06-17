const { z } = require('zod');

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(1, 'Senha é obrigatória'),
});

const criarUsuarioSchema = z.object({
    nome:  z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    perfil: z.enum(['solicitante', 'tecnico', 'admin'], {
        errorMap: () => ({ message: 'Perfil inválido' }),
    }),
});

const criarChamadoSchema = z.object({
    titulo:    z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200),
    descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    categoria: z.string().max(100).optional(),
    prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
});

const atualizarChamadoSchema = z.object({
    status: z.enum(['aberto', 'em_andamento', 'aguardando', 'resolvido', 'cancelado']).optional(),
    responsavel_id: z.number().nullable().optional(),
    observacao: z.string().min(3).optional(),
});

module.exports = { loginSchema, criarUsuarioSchema, criarChamadoSchema, atualizarChamadoSchema };
