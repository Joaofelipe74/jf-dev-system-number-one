/**
 * Seed de dados de demonstração — 100% fictício, sem nenhuma informação
 * pessoal real. Cria: negócio demo, horário de funcionamento,
 * profissionais, serviços, clientes e um histórico de agendamentos
 * (passados e futuros) para o dashboard já nascer com dados.
 *
 * CORREÇÕES DE SEGURANÇA desta auditoria em relação à versão anterior:
 *
 * 1. Este script NÃO cria mais a conta de administrador (isso agora é
 *    responsabilidade exclusiva de `prisma/create-admin.ts`, que lê a
 *    senha de variável de ambiente/prompt — nunca de um valor fixo no
 *    código-fonte).
 * 2. Este script agora RECUSA rodar contra um banco que já tenha dados —
 *    antes, ele começava apagando TUDO incondicionalmente
 *    (`$transaction([...deleteMany()])`), o que faria com que rodar
 *    `npm run db:seed` por engano contra um banco de produção destruísse
 *    todos os dados reais. Agora:
 *      - se `NODE_ENV=production`, o script recusa rodar, a menos que a
 *        variável `SEED_FORCE=eu-entendo-que-isso-apaga-dados` seja
 *        definida explicitamente;
 *      - independentemente do ambiente, se o banco já tiver qualquer
 *        negócio cadastrado, o script recusa rodar (evita apagar dados de
 *        uma instalação já em uso), a menos que `SEED_FORCE` esteja
 *        definida com o mesmo valor acima.
 *
 * Execução: npm run db:seed
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WEEKDAYS_MON_TO_SAT = [1, 2, 3, 4, 5, 6];
const FORCE_TOKEN = 'eu-entendo-que-isso-apaga-dados';

async function assertSafeToSeed() {
  const forced = process.env.SEED_FORCE === FORCE_TOKEN;

  if (process.env.NODE_ENV === 'production' && !forced) {
    throw new Error(
      'Recusado: NODE_ENV=production. O seed de demonstração apaga dados existentes e nunca deve ' +
        `rodar em produção. Se você TEM CERTEZA (ex.: um ambiente de staging), defina SEED_FORCE=${FORCE_TOKEN}.`
    );
  }

  const existingBusinessCount = await prisma.business.count();
  if (existingBusinessCount > 0 && !forced) {
    throw new Error(
      `Recusado: o banco já contém ${existingBusinessCount} negócio(s) cadastrado(s). Este script apaga ` +
        `todos os dados antes de recriar os dados de demonstração — rodá-lo contra um banco já em uso ` +
        `destruiria dados reais. Se você TEM CERTEZA de que quer apagar tudo e recriar os dados de ` +
        `demonstração, defina a variável de ambiente SEED_FORCE=${FORCE_TOKEN} e rode novamente.`
    );
  }
}

async function main() {
  await assertSafeToSeed();

  console.log('Iniciando seed de dados de demonstração...');

  await prisma.$transaction([
    prisma.clientAccessCode.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.blockedTime.deleteMany(),
    prisma.professionalService.deleteMany(),
    prisma.professionalWorkingHour.deleteMany(),
    prisma.service.deleteMany(),
    prisma.client.deleteMany(),
    prisma.professional.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.businessHour.deleteMany(),
    prisma.business.deleteMany(),
    // NOTA: `profiles` (contas administrativas) NUNCA é apagado aqui —
    // é gerenciado exclusivamente por `prisma/create-admin.ts`.
  ]);

  const business = await prisma.business.create({
    data: {
      name: 'Studio Nova Era',
      segment: 'Estética & Bem-estar',
      timezone: 'America/Sao_Paulo',
    },
  });

  await prisma.setting.create({
    data: {
      businessId: business.id,
      slotIntervalMinutes: 30,
      bookingWindowDays: 30,
      cancellationWindowHours: 2,
      whatsappNumber: null,
    },
  });

  // Funcionamento: seg-sex 09h-19h, sáb 09h-14h, dom fechado
  await prisma.businessHour.createMany({
    data: [
      { businessId: business.id, weekday: 0, isOpen: false, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 1, isOpen: true, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 2, isOpen: true, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 3, isOpen: true, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 4, isOpen: true, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 5, isOpen: true, startTime: '09:00', endTime: '19:00' },
      { businessId: business.id, weekday: 6, isOpen: true, startTime: '09:00', endTime: '14:00' },
    ],
  });

  const services = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Corte Moderno',
        description: 'Corte personalizado com finalização profissional.',
        priceCents: 8000,
        durationMinutes: 45,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Coloração Premium',
        description: 'Coloração completa com produtos de alta performance.',
        priceCents: 22000,
        durationMinutes: 120,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Barba Terapia',
        description: 'Modelagem de barba com toalha quente e produtos premium.',
        priceCents: 6000,
        durationMinutes: 30,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Limpeza de Pele',
        description: 'Higienização profunda com extração e hidratação.',
        priceCents: 15000,
        durationMinutes: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Massagem Relaxante',
        description: 'Sessão de 60 minutos para alívio de tensão muscular.',
        priceCents: 18000,
        durationMinutes: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Manicure & Pedicure',
        description: 'Cuidado completo das unhas das mãos e dos pés.',
        priceCents: 9000,
        durationMinutes: 50,
        isActive: false,
      },
    }),
  ]);

  const professionalsData = [
    { name: 'Camila Duarte', specialty: 'Cabelo & Coloração', phone: '11988887001', email: 'camila@studionovaera.com.br', avatarColor: '#00A8FF' },
    { name: 'Rafael Souza', specialty: 'Barbearia', phone: '11988887002', email: 'rafael@studionovaera.com.br', avatarColor: '#8B5CF6' },
    { name: 'Beatriz Lima', specialty: 'Estética Facial', phone: '11988887003', email: 'beatriz@studionovaera.com.br', avatarColor: '#00C2FF' },
    { name: 'Diego Martins', specialty: 'Massoterapia', phone: '11988887004', email: 'diego@studionovaera.com.br', avatarColor: '#6C5CE7' },
  ];

  const professionals = [];
  for (const data of professionalsData) {
    const professional = await prisma.professional.create({
      data: {
        businessId: business.id,
        name: data.name,
        specialty: data.specialty,
        phone: data.phone,
        email: data.email,
        avatarColor: data.avatarColor,
        isActive: true,
        workingHours: {
          create: WEEKDAYS_MON_TO_SAT.map((weekday) => ({
            weekday,
            startTime: weekday === 6 ? '09:00' : '09:00',
            endTime: weekday === 6 ? '14:00' : '19:00',
          })),
        },
      },
    });
    professionals.push(professional);
  }

  const [camila, rafael, beatriz, diego] = professionals;
  const [corte, coloracao, barba, limpeza, massagem] = services;

  await prisma.professionalService.createMany({
    data: [
      { professionalId: camila!.id, serviceId: corte!.id },
      { professionalId: camila!.id, serviceId: coloracao!.id },
      { professionalId: rafael!.id, serviceId: corte!.id },
      { professionalId: rafael!.id, serviceId: barba!.id },
      { professionalId: beatriz!.id, serviceId: limpeza!.id },
      { professionalId: diego!.id, serviceId: massagem!.id },
    ],
  });

  const clientsData = [
    { name: 'Fernanda Alves', phone: '11977776001', email: 'fernanda.alves@exemplo.com' },
    { name: 'João Pedro Nogueira', phone: '11977776002', email: 'joaopedro@exemplo.com' },
    { name: 'Larissa Cunha', phone: '11977776003', email: 'larissa.cunha@exemplo.com' },
    { name: 'Marcos Vinícius', phone: '11977776004', email: 'marcos.v@exemplo.com' },
    { name: 'Patrícia Gomes', phone: '11977776005', email: 'patricia.gomes@exemplo.com' },
    { name: 'Thiago Ramos', phone: '11977776006', email: 'thiago.ramos@exemplo.com' },
  ];

  const clients = [];
  for (const data of clientsData) {
    const client = await prisma.client.create({ data: { businessId: business.id, ...data } });
    clients.push(client);
  }

  // Agendamentos fictícios: passados (com status variados) + futuros
  const now = new Date();
  function atHour(daysOffset: number, hour: number, minute = 0): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  const appointmentsSeed: Array<{
    clientId: string;
    professionalId: string;
    serviceId: string;
    startsAt: Date;
    durationMinutes: number;
    priceCents: number;
    status: string;
  }> = [
    // Passados — para alimentar métricas
    { clientId: clients[0]!.id, professionalId: camila!.id, serviceId: corte!.id, startsAt: atHour(-30, 10), durationMinutes: 45, priceCents: 8000, status: 'completed' },
    { clientId: clients[1]!.id, professionalId: rafael!.id, serviceId: barba!.id, startsAt: atHour(-28, 11), durationMinutes: 30, priceCents: 6000, status: 'completed' },
    { clientId: clients[2]!.id, professionalId: beatriz!.id, serviceId: limpeza!.id, startsAt: atHour(-21, 14), durationMinutes: 60, priceCents: 15000, status: 'completed' },
    { clientId: clients[3]!.id, professionalId: camila!.id, serviceId: coloracao!.id, startsAt: atHour(-18, 9), durationMinutes: 120, priceCents: 22000, status: 'completed' },
    { clientId: clients[4]!.id, professionalId: diego!.id, serviceId: massagem!.id, startsAt: atHour(-14, 16), durationMinutes: 60, priceCents: 18000, status: 'completed' },
    { clientId: clients[0]!.id, professionalId: rafael!.id, serviceId: corte!.id, startsAt: atHour(-10, 10), durationMinutes: 45, priceCents: 8000, status: 'completed' },
    { clientId: clients[5]!.id, professionalId: beatriz!.id, serviceId: limpeza!.id, startsAt: atHour(-9, 13), durationMinutes: 60, priceCents: 15000, status: 'no_show' },
    { clientId: clients[1]!.id, professionalId: camila!.id, serviceId: corte!.id, startsAt: atHour(-7, 15), durationMinutes: 45, priceCents: 8000, status: 'completed' },
    { clientId: clients[2]!.id, professionalId: diego!.id, serviceId: massagem!.id, startsAt: atHour(-5, 11), durationMinutes: 60, priceCents: 18000, status: 'cancelled' },
    { clientId: clients[3]!.id, professionalId: rafael!.id, serviceId: barba!.id, startsAt: atHour(-3, 9), durationMinutes: 30, priceCents: 6000, status: 'completed' },
    { clientId: clients[4]!.id, professionalId: camila!.id, serviceId: coloracao!.id, startsAt: atHour(-1, 10), durationMinutes: 120, priceCents: 22000, status: 'completed' },
    // Hoje
    { clientId: clients[5]!.id, professionalId: rafael!.id, serviceId: corte!.id, startsAt: atHour(0, 15), durationMinutes: 45, priceCents: 8000, status: 'confirmed' },
    // Futuros
    { clientId: clients[0]!.id, professionalId: beatriz!.id, serviceId: limpeza!.id, startsAt: atHour(1, 10), durationMinutes: 60, priceCents: 15000, status: 'confirmed' },
    { clientId: clients[1]!.id, professionalId: diego!.id, serviceId: massagem!.id, startsAt: atHour(2, 16), durationMinutes: 60, priceCents: 18000, status: 'pending' },
    { clientId: clients[2]!.id, professionalId: camila!.id, serviceId: corte!.id, startsAt: atHour(3, 9), durationMinutes: 45, priceCents: 8000, status: 'confirmed' },
    { clientId: clients[3]!.id, professionalId: rafael!.id, serviceId: barba!.id, startsAt: atHour(4, 11), durationMinutes: 30, priceCents: 6000, status: 'pending' },
  ];

  for (const appt of appointmentsSeed) {
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: appt.clientId,
        professionalId: appt.professionalId,
        serviceId: appt.serviceId,
        startsAt: appt.startsAt,
        endsAt: new Date(appt.startsAt.getTime() + appt.durationMinutes * 60_000),
        priceCents: appt.priceCents,
        status: appt.status,
      },
    });
  }

  // Um bloqueio de exemplo (folga de um profissional)
  await prisma.blockedTime.create({
    data: {
      businessId: business.id,
      professionalId: diego!.id,
      title: 'Compromisso pessoal',
      startsAt: atHour(2, 12),
      endsAt: atHour(2, 13, 30),
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log('----------------------------------------------------');
  console.log('Dados fictícios criados. Nenhuma conta de administrador foi criada por este script.');
  console.log('Rode "npm run db:create-admin" para criar (ou atualizar) a conta de administrador.');
  console.log('----------------------------------------------------');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
