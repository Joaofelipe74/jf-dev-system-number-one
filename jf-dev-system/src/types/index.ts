/**
 * Tipos compartilhados da aplicação.
 * Evitamos `any` em toda a base de código — qualquer forma nova de dado
 * deve ganhar uma interface/tipo aqui (ou próxima ao módulo que a origina).
 */

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  professionalIds: string[];
}

export interface ProfessionalWorkingHour {
  weekday: number; // 0 = domingo ... 6 = sábado
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface ProfessionalDTO {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  isActive: boolean;
  avatarColor: string;
  serviceIds: string[];
  workingHours: ProfessionalWorkingHour[];
}

/** Dados mínimos e públicos usados no fluxo de agendamento. */
export type BookingServiceDTO = Pick<
  ServiceDTO,
  'id' | 'name' | 'description' | 'priceCents' | 'durationMinutes' | 'professionalIds'
>;

/**
 * Não inclui telefone nem e-mail do profissional: esses dados não precisam
 * sair do servidor para que um cliente escolha quem fará o atendimento.
 */
export interface BookingProfessionalDTO {
  id: string;
  name: string;
  specialty: string;
  avatarColor: string;
  serviceIds: string[];
}

/** Uma única resposta carrega tudo que as três primeiras etapas precisam. */
export interface BookingBootstrapDTO {
  businessName: string;
  whatsappNumber: string | null;
  bookingWindowDays: number;
  services: BookingServiceDTO[];
  professionals: BookingProfessionalDTO[];
}

export interface ClientDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  appointmentsCount: number;
  lastAppointmentAt: string | null;
}

export interface AppointmentDTO {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  priceCents: number;
  notes: string | null;
  createdAt: string;
}

export interface BlockedTimeDTO {
  id: string;
  professionalId: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface BusinessHourDTO {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  start: string; // ISO
  end: string; // ISO
  label: string; // "09:00"
}

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface DashboardSummary {
  appointmentsToday: number;
  /** Total de clientes cadastrados (não apenas "ativos" em algum período — o rótulo na tela reflete exatamente isso). */
  totalClients: number;
  /** Receita estimada com base nos atendimentos concluídos dos últimos 6 meses. */
  estimatedRevenueCents: number;
  /** Concluídos, cancelamentos e séries abaixo cobrem os últimos 6 meses (mesma janela dos Relatórios). */
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  revenueBySeries: { label: string; valueCents: number }[];
  appointmentsBySeries: { label: string; value: number }[];
  topServices: { name: string; value: number }[];
  byProfessional: { name: string; value: number }[];
  monthlyEvolution: { label: string; revenueCents: number; appointments: number }[];
}
