'use client';

import { useState } from 'react';
import { CalendarCheck, Clock, Scissors, User, PartyPopper, MessageCircle, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { formatCurrency, formatDuration } from '@/lib/utils';
import type { BookingServiceDTO, BookingProfessionalDTO } from '@/types';
import type { ClientDetails } from '@/components/booking/step-details';

interface StepConfirmProps {
  service: BookingServiceDTO;
  professional: BookingProfessionalDTO;
  slotIso: string;
  slotLabel: string;
  dateLabel: string;
  client: ClientDetails;
  /** WhatsApp do PRÓPRIO estabelecimento (nunca o contato comercial da JF Dev) — pode não estar configurado. */
  businessWhatsappLink: string | null;
  businessName: string;
  onConflict: () => void;
}

export function StepConfirm({
  service,
  professional,
  slotIso,
  slotLabel,
  dateLabel,
  client,
  businessWhatsappLink,
  businessName,
  onConflict,
}: StepConfirmProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedStatus, setConfirmedStatus] = useState<'pending' | 'confirmed'>('pending');

  async function handleConfirm() {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await apiFetch<{ appointment: { status: 'pending' | 'confirmed' | string } }>(
        '/api/appointments',
        {
          method: 'POST',
          body: JSON.stringify({
            serviceId: service.id,
            professionalId: professional.id,
            startsAt: slotIso,
            client: {
              name: client.name,
              phone: client.phone,
              email: client.email || undefined,
              notes: client.notes || undefined,
            },
          }),
        }
      );
      // O status real devolvido pelo servidor decide a mensagem exibida —
      // nunca afirmamos "confirmado" para um agendamento que nasceu como
      // "pendente" (correção da auditoria: a tela anterior sempre dizia
      // "Agendamento confirmado!", mesmo quando o status real era
      // "pending", que é o padrão para novos agendamentos).
      setConfirmedStatus(result.appointment.status === 'confirmed' ? 'confirmed' : 'pending');
      setStatus('success');
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message);
        if (error.status === 409) onConflict();
      } else {
        setErrorMessage('Não foi possível confirmar o agendamento. Tente novamente.');
      }
    }
  }

  const whatsappMessage = `Olá! Acabei de agendar ${service.name} para ${dateLabel} às ${slotLabel}.`;
  const whatsappHref = businessWhatsappLink
    ? `${businessWhatsappLink}${businessWhatsappLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(whatsappMessage)}`
    : null;

  if (status === 'success') {
    const isPending = confirmedStatus === 'pending';
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            isPending ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'
          }`}
        >
          {isPending ? <Hourglass className="h-7 w-7" aria-hidden /> : <PartyPopper className="h-7 w-7" aria-hidden />}
        </div>
        <h3 className="font-display text-xl font-bold text-ink">
          {isPending ? 'Solicitação de agendamento enviada!' : 'Agendamento confirmado!'}
        </h3>
        {/* Mensagem honesta: nada aqui afirma que um SMS/e-mail foi enviado
            — isso nunca aconteceu de verdade neste projeto. */}
        <p className="max-w-sm text-sm text-ink-muted">
          {isPending
            ? `Seu horário com ${businessName || 'o estabelecimento'} está reservado como pendente de confirmação. Guarde os dados abaixo — você pode consultá-los a qualquer momento na Área do Cliente.`
            : `Seu horário com ${businessName || 'o estabelecimento'} está confirmado. Guarde os dados abaixo — você pode consultá-los a qualquer momento na Área do Cliente.`}{' '}
          Chegue com alguns minutos de antecedência.
        </p>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-2">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4" />
              Falar com {businessName || 'o estabelecimento'} pelo WhatsApp
            </Button>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="divide-y divide-border-soft p-0">
        <SummaryRow icon={Scissors} label="Serviço" value={`${service.name} · ${formatCurrency(service.priceCents)}`} />
        <SummaryRow icon={User} label="Profissional" value={professional.name} />
        <SummaryRow icon={CalendarCheck} label="Data" value={dateLabel} />
        <SummaryRow icon={Clock} label="Horário" value={`${slotLabel} (${formatDuration(service.durationMinutes)})`} />
      </Card>

      <Card className="p-4">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{client.name}</span> · {client.phone}
        </p>
      </Card>

      {status === 'error' && errorMessage && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </p>
      )}

      <Button size="lg" className="w-full" onClick={handleConfirm} isLoading={status === 'loading'}>
        Confirmar agendamento
      </Button>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scissors;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <Icon className="h-4 w-4 shrink-0 text-blue-neon" aria-hidden />
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="ml-auto text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
