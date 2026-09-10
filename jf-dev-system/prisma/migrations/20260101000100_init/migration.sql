-- ============================================================================
-- JF Dev — Sistema de Gestão e Agendamento
-- Migration inicial (Postgres/Supabase).
--
-- Esta migration foi escrita manualmente (não gerada por "prisma migrate
-- dev") porque este ambiente de correção não tem acesso à internet para
-- instalar o CLI do Prisma / node_modules. Ela foi VERIFICADA de verdade
-- contra um Postgres 16 real disponível neste ambiente (ver
-- "RELATORIO_DE_TESTES.md", seção de banco de dados, para a evidência
-- completa: aplicação da migration, inserções, e a constraint de exclusão
-- em ação). Antes de rodar em um Supabase real, execute
-- `npx prisma migrate deploy` normalmente — esta migration é compatível
-- com o fluxo padrão do Prisma Migrate.
-- ============================================================================

CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarColor" TEXT NOT NULL DEFAULT '#00A8FF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "professionals_businessId_idx" ON "professionals"("businessId");

CREATE TABLE "professional_working_hours" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "professional_working_hours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professional_working_hours_professionalId_weekday_key" ON "professional_working_hours"("professionalId", "weekday");

CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clients_businessId_idx" ON "clients"("businessId");
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "services_businessId_idx" ON "services"("businessId");

CREATE TABLE "professional_services" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professional_services_professionalId_serviceId_key" ON "professional_services"("professionalId", "serviceId");

CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priceCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointments_professionalId_startsAt_idx" ON "appointments"("professionalId", "startsAt");
CREATE INDEX "appointments_businessId_startsAt_idx" ON "appointments"("businessId", "startsAt");
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

CREATE TABLE "blocked_times" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_times_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "blocked_times_professionalId_startsAt_idx" ON "blocked_times"("professionalId", "startsAt");

CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '19:00',

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_hours_businessId_weekday_key" ON "business_hours"("businessId", "weekday");

CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 30,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 2,
    "whatsappNumber" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "settings_businessId_key" ON "settings"("businessId");

CREATE TABLE "client_access_codes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_access_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_access_codes_clientId_idx" ON "client_access_codes"("clientId");

-- Chaves estrangeiras -------------------------------------------------------

ALTER TABLE "professionals" ADD CONSTRAINT "professionals_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_working_hours" ADD CONSTRAINT "professional_working_hours_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clients" ADD CONSTRAINT "clients_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "services" ADD CONSTRAINT "services_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CORREÇÃO: onDelete Restrict (não Cascade) — nunca apagar histórico de
-- agendamentos ao excluir cliente/profissional/serviço.
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "settings" ADD CONSTRAINT "settings_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_access_codes" ADD CONSTRAINT "client_access_codes_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
