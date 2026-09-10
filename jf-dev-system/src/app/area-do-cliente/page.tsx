'use client';

import { useState } from 'react';
import { Search, CalendarCheck, ShieldCheck, XCircle } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dates';
import type { AppointmentDTO } from '@/types';

type Stage = 'contact' | 'code' | 'verified';

/**
 * Área do Cliente — reescrita nesta correção.
 *
 * ANTES: um único campo (telefone OU e-mail) buscava diretamente o
 * histórico por correspondência PARCIAL (`contains`) — qualquer pessoa que
 * soubesse um pedaço do contato de outro cliente via o cadastro completo
 * dele. Também exibia uma mensagem falsa de que os dados foram "enviados
 * por SMS", sem nenhum envio real acontecer.
 *
 * AGORA: fluxo de duas etapas com verificação por código de uso único
 * (`/api/client-lookup/request` → `/api/client-lookup/verify`), sem NUNCA
 * revelar se um contato existe antes da verificação, e com cancelamento
 * real de agendamentos futuros (respeitando a janela de cancelamento
 * configurada pelo negócio).
 */
export default function ClientAreaPage() {
  const { showToast } = useToast();
  const [stage, setStage] = useState<Stage>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDTO | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ message: string }>('/api/client-lookup/request', {
        method: 'POST',
        body: JSON.stringify({ contact }),
      });
      setInfoMessage(data.message);
      setStage('code');
    } catch (error) {
      setErrorMessage(error instanceof ApiRequestError ? error.message : 'Não foi possível processar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ clientName: string; appointments: AppointmentDTO[]; accessToken: string }>(
        '/api/client-lookup/verify',
        { method: 'POST', body: JSON.stringify({ contact, code }) }
      );
      setClientName(data.clientName);
      setAppointments(data.appointments);
      setAccessToken(data.accessToken);
      setStage('verified');
    } catch (error) {
      setErrorMessage(error instanceof ApiRequestError ? error.message : 'Não foi possível verificar o código.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget || !accessToken) return;
    setIsCancelling(true);
    try {
      await apiFetch(`/api/client-appointments/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
      );
      showToast('success', 'Agendamento cancelado.');
      setCancelTarget(null);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Não foi possível cancelar.');
    } finally {
      setIsCancelling(false);
    }
  }

  const now = Date.now();
  const upcoming = appointments.filter(
    (a) => new Date(a.startsAt).getTime() >= now && a.status !== 'cancelled'
  );
  const past = appointments.filter(
    (a) => new Date(a.startsAt).getTime() < now || a.status === 'cancelled'
  );

  return (
    <>
      <SiteHeader />
      <main className="section-padding pt-28 sm:pt-32">
        <div className="container-app max-w-2xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-neon">
              Área do cliente
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Consulte seus agendamentos
            </h1>
            <p className="mt-3 text-ink-muted">
              Por segurança, confirmamos sua identidade com um código de acesso de uso único antes
              de mostrar qualquer agendamento.
            </p>
          </div>

          {stage === 'contact' && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleRequestCode} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
                  <div className="flex-1">
                    <Label htmlFor="contact">Telefone ou e-mail cadastrado</Label>
                    <Input
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="(11) 99999-9999 ou voce@email.com"
                    />
                  </div>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Search className="h-4 w-4" /> Solicitar código
                  </Button>
                </form>
                {errorMessage && (
                  <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-300">
                    {errorMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {stage === 'code' && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-3 rounded-lg border border-blue-electric/30 bg-blue-electric/5 p-4 text-sm text-ink-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-neon" aria-hidden />
                  <p>
                    {infoMessage}{' '}
                    Neste ambiente de demonstração, sem um provedor real de SMS/e-mail configurado, o
                    código é registrado nos logs do servidor — peça ao administrador do sistema, ou
                    configure um provedor real antes de publicar (veja o README).
                  </p>
                </div>
                <form onSubmit={handleVerifyCode} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
                  <div className="flex-1">
                    <Label htmlFor="code">Código de 6 dígitos</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                    />
                  </div>
                  <Button type="submit" isLoading={isSubmitting}>
                    Verificar
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setStage('contact');
                    setCode('');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
                >
                  Usar outro contato
                </button>
                {errorMessage && (
                  <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-300">
                    {errorMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {stage === 'verified' && (
            <div className="space-y-8">
              <p className="text-sm text-ink-muted">
                Agendamentos de <span className="font-medium text-ink">{clientName}</span>
              </p>

              <section>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-blue-neon">
                  Próximos agendamentos
                </h2>
                {upcoming.length === 0 ? (
                  <EmptyState icon={CalendarCheck} title="Nenhum agendamento futuro" />
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map((a) => (
                      <AppointmentRow key={a.id} appointment={a} onCancel={() => setCancelTarget(a)} />
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  Histórico
                </h2>
                {past.length === 0 ? (
                  <p className="text-sm text-ink-muted">Nenhum atendimento anterior.</p>
                ) : (
                  <ul className="space-y-2">
                    {past.map((a) => (
                      <AppointmentRow key={a.id} appointment={a} />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar agendamento?"
        description="Esta ação não pode ser desfeita. Se o horário estiver fora da janela mínima de cancelamento, não será possível cancelar por aqui."
        confirmLabel="Cancelar agendamento"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </>
  );
}

function AppointmentRow({
  appointment,
  onCancel,
}: {
  appointment: AppointmentDTO;
  onCancel?: () => void;
}) {
  const canCancel = onCancel && (appointment.status === 'pending' || appointment.status === 'confirmed');
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-soft bg-surface p-4">
      <div>
        <p className="text-sm font-medium text-ink">{appointment.serviceName}</p>
        <p className="text-xs text-ink-muted">
          {appointment.professionalName} · {formatDateTime(appointment.startsAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={appointment.status} />
        {canCancel && (
          <button
            onClick={onCancel}
            aria-label="Cancelar agendamento"
            title="Cancelar agendamento"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
