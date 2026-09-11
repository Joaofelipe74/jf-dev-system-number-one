'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { BookingProgress } from '@/components/booking/booking-progress';
import { StepService } from '@/components/booking/step-service';
import { StepProfessional } from '@/components/booking/step-professional';
import { StepDate } from '@/components/booking/step-date';
import { StepTime } from '@/components/booking/step-time';
import { StepDetails, type ClientDetails } from '@/components/booking/step-details';
import { StepConfirm } from '@/components/booking/step-confirm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';
import type {
  BookingBootstrapDTO,
  BookingProfessionalDTO,
  BookingServiceDTO,
} from '@/types';

const STEP_TITLES = [
  'Qual serviço você deseja?',
  'Escolha o profissional',
  'Escolha a data',
  'Escolha o horário',
  'Seus dados',
  'Confirme seu agendamento',
];

const STEP_DESCRIPTIONS = [
  'Selecione o serviço para ver profissionais e horários disponíveis.',
  'Cada profissional tem uma especialidade e agenda própria.',
  'Mostramos os próximos dias disponíveis para agendamento.',
  'Somente horários realmente livres aparecem aqui.',
  'Usaremos esses dados só para confirmar o seu atendimento.',
  'Revise tudo antes de confirmar.',
];

export function BookingFlow() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<BookingServiceDTO | null>(null);
  const [professional, setProfessional] = useState<BookingProfessionalDTO | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ iso: string; label: string } | null>(null);
  const [client, setClient] = useState<ClientDetails>({ name: '', phone: '', email: '', notes: '' });
  const [bootstrap, setBootstrap] = useState<BookingBootstrapDTO | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<BookingBootstrapDTO>('/api/public/booking-bootstrap')
      .then(setBootstrap)
      .catch(() => setBootstrapError('Não foi possível carregar as opções agora. Tente novamente em instantes.'));
  }, []);

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function resetAfterConflict() {
    // Se o horário foi ocupado por outra pessoa entre a listagem e a confirmação,
    // voltamos para a escolha de horário e forçamos nova consulta de disponibilidade.
    setSlot(null);
    setStep(4);
  }

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
    : '';

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <CardHeader className="border-b border-border-soft bg-surface-elevated/40">
        <BookingProgress currentStep={step} />
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              aria-label="Voltar para a etapa anterior"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-soft text-ink-muted hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <CardTitle>{STEP_TITLES[step - 1]}</CardTitle>
            <CardDescription>{STEP_DESCRIPTIONS[step - 1]}</CardDescription>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 1 && (
              <StepService
                services={bootstrap?.services ?? null}
                error={bootstrapError}
                selectedServiceId={service?.id ?? null}
                onSelect={(s) => {
                  setService(s);
                  setProfessional(null);
                  setStep(2);
                }}
              />
            )}

            {step === 2 && service && (
              <StepProfessional
                professionals={(bootstrap?.professionals ?? []).filter((item) =>
                  item.serviceIds.includes(service.id)
                )}
                selectedProfessionalId={professional?.id ?? null}
                onSelect={(p) => {
                  setProfessional(p);
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <StepDate
                selectedDate={date}
                windowDays={bootstrap?.bookingWindowDays}
                onSelect={(d) => {
                  setDate(d);
                  setSlot(null);
                  setStep(4);
                }}
              />
            )}

            {step === 4 && service && professional && date && (
              <StepTime
                serviceId={service.id}
                professionalId={professional.id}
                date={date}
                selectedSlotIso={slot?.iso ?? null}
                onSelect={(s) => {
                  setSlot(s);
                  setStep(5);
                }}
              />
            )}

            {step === 5 && (
              <StepDetails
                initialValues={client}
                onSubmit={(details) => {
                  setClient(details);
                  setStep(6);
                }}
              />
            )}

            {step === 6 && service && professional && slot && (
              <StepConfirm
                service={service}
                professional={professional}
                slotIso={slot.iso}
                slotLabel={slot.label}
                dateLabel={dateLabel}
                client={client}
                businessName={bootstrap?.businessName ?? ''}
                businessWhatsappLink={
                  bootstrap?.whatsappNumber ? `https://wa.me/${bootstrap.whatsappNumber}` : null
                }
                onConflict={resetAfterConflict}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
