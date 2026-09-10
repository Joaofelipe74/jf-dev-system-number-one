import { z } from 'zod';
import { onlyDigits } from '@/lib/utils';

/**
 * Schemas de validação centralizados, com mensagens em português.
 * Usados tanto no formulário (client-side) quanto nas rotas de API
 * (server-side) — a regra nunca deve existir só no frontend.
 */

const phoneSchema = z
  .string()
  .min(1, 'Informe um telefone.')
  .refine((value) => onlyDigits(value).length >= 10, {
    message: 'Informe um telefone válido, com DDD.',
  });

const emailOptionalSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Informe um e-mail válido.',
  });

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const serviceSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  description: z.string().max(500, 'A descrição pode ter no máximo 500 caracteres.').optional(),
  priceCents: z.coerce.number().int().min(0, 'Informe um preço válido.'),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, 'A duração mínima é de 5 minutos.')
    .max(480, 'A duração máxima é de 8 horas.'),
  isActive: z.boolean().default(true),
  professionalIds: z.array(z.string()).default([]),
});

export const professionalWorkingHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
});

export const professionalSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  specialty: z.string().min(2, 'Informe a especialidade.'),
  phone: phoneSchema,
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  isActive: z.boolean().default(true),
  avatarColor: z.string().default('#00A8FF'),
  serviceIds: z.array(z.string()).default([]),
  workingHours: z.array(professionalWorkingHourSchema).default([]),
});

export const clientSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  phone: phoneSchema,
  email: emailOptionalSchema,
  notes: z.string().max(1000, 'As observações podem ter no máximo 1000 caracteres.').optional(),
});

export const blockedTimeSchema = z
  .object({
    professionalId: z.string().nullable(),
    title: z.string().min(2, 'Informe um título para o bloqueio.'),
    startsAt: z.string().min(1, 'Informe a data/hora de início.'),
    endsAt: z.string().min(1, 'Informe a data/hora de término.'),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'O término deve ser depois do início.',
    path: ['endsAt'],
  });

export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, 'Selecione um serviço.'),
  professionalId: z.string().min(1, 'Selecione um profissional.'),
  startsAt: z.string().min(1, 'Selecione um horário.'),
  client: z.object({
    name: z.string().min(2, 'Informe seu nome completo.'),
    phone: phoneSchema,
    email: emailOptionalSchema,
    notes: z.string().max(500).optional(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
});

export const businessHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
});

export const settingsSchema = z.object({
  slotIntervalMinutes: z.coerce.number().int().min(5).max(120),
  bookingWindowDays: z.coerce.number().int().min(1).max(180),
  cancellationWindowHours: z.coerce.number().int().min(0).max(72),
  whatsappNumber: z.string().optional(),
});

export const clientAccessRequestSchema = z.object({
  contact: z.string().min(3, 'Informe seu telefone ou e-mail cadastrado.'),
});

export const clientAccessVerifySchema = z.object({
  contact: z.string().min(3, 'Informe seu telefone ou e-mail cadastrado.'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type BlockedTimeInput = z.infer<typeof blockedTimeSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

/** Extrai um mapa `campo -> mensagem` a partir de um erro do Zod. */
export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
