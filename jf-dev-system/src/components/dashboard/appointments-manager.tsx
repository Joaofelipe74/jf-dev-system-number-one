'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, CalendarClock, CheckCircle2, XCircle, UserX, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { formatDateTime } from '@/utils/dates';
import { AdminAppointmentForm } from '@/components/dashboard/admin-appointment-form';
import { RescheduleForm } from '@/components/dashboard/reschedule-form';
import { STATUS_LABELS } from '@/lib/constants';
import type { AppointmentDTO, AppointmentStatus, ServiceDTO, ProfessionalDTO } from '@/types';

interface AppointmentsManagerProps {
  initialAppointments: AppointmentDTO[];
  services: ServiceDTO[];
  professionals: ProfessionalDTO[];
}

const STATUS_OPTIONS: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

export function AppointmentsManager({ initialAppointments, services, professionals }: AppointmentsManagerProps) {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [professionalFilter, setProfessionalFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentDTO | null>(null);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .filter((a) => professionalFilter === 'all' || a.professionalId === professionalFilter)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointments, statusFilter, professionalFilter]);

  async function updateStatus(appointment: AppointmentDTO, status: AppointmentStatus) {
    setUpdatingId(appointment.id);
    const previous = appointment.status;
    setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, status } : a)));
    try {
      await apiFetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', `Status atualizado para "${STATUS_LABELS[status]}".`);
    } catch (error) {
      setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, status: previous } : a)));
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/appointments/${deleteTarget.id}`, { method: 'DELETE' });
      setAppointments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast('success', 'Agendamento excluído.');
      setDeleteTarget(null);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao excluir agendamento.');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    showToast('success', 'Agendamento criado com sucesso.');
    if (typeof window !== 'undefined') window.location.reload();
  }

  function handleRescheduled() {
    setRescheduleTarget(null);
    showToast('success', 'Agendamento reagendado com sucesso.');
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Agendamentos</h1>
          <p className="text-sm text-ink-muted">Todos os agendamentos do negócio, com filtros e ações rápidas.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Novo agendamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | AppointmentStatus)}
          className="w-auto"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={professionalFilter} onChange={(e) => setProfessionalFilter(e.target.value)} className="w-auto">
          <option value="all">Todos os profissionais</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhum agendamento encontrado"
          description="Ajuste os filtros ou crie um novo agendamento."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3.5 font-medium">Data / Hora</th>
                <th className="px-5 py-3.5 font-medium">Cliente</th>
                <th className="px-5 py-3.5 font-medium">Serviço</th>
                <th className="px-5 py-3.5 font-medium">Profissional</th>
                <th className="px-5 py-3.5 font-medium">Valor</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appointment) => (
                <tr key={appointment.id} className="border-b border-border-soft last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink">{formatDateTime(appointment.startsAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-ink">{appointment.clientName}</div>
                    <div className="text-xs text-ink-muted">{appointment.clientPhone}</div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{appointment.serviceName}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{appointment.professionalName}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatCurrency(appointment.priceCents)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      {appointment.status !== 'confirmed' && appointment.status !== 'completed' && (
                        <ActionButton
                          label={
                            appointment.status === 'cancelled' || appointment.status === 'no_show'
                              ? 'Reativar'
                              : 'Confirmar'
                          }
                          icon={CheckCircle2}
                          onClick={() => updateStatus(appointment, 'confirmed')}
                          disabled={updatingId === appointment.id}
                          className="hover:text-blue-neon"
                        />
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <ActionButton
                          label="Reagendar"
                          icon={Repeat}
                          onClick={() => setRescheduleTarget(appointment)}
                          disabled={updatingId === appointment.id}
                          className="hover:text-violet-neon"
                        />
                      )}
                      {appointment.status !== 'completed' && (
                        <ActionButton
                          label="Concluir"
                          icon={CheckCircle2}
                          onClick={() => updateStatus(appointment, 'completed')}
                          disabled={updatingId === appointment.id}
                          className="hover:text-emerald-300"
                        />
                      )}
                      {appointment.status !== 'no_show' && (
                        <ActionButton
                          label="Não compareceu"
                          icon={UserX}
                          onClick={() => updateStatus(appointment, 'no_show')}
                          disabled={updatingId === appointment.id}
                          className="hover:text-amber-300"
                        />
                      )}
                      {appointment.status !== 'cancelled' && (
                        <ActionButton
                          label="Cancelar"
                          icon={XCircle}
                          onClick={() => updateStatus(appointment, 'cancelled')}
                          disabled={updatingId === appointment.id}
                          className="hover:text-rose-300"
                        />
                      )}
                      <ActionButton
                        label="Excluir"
                        icon={Trash2}
                        onClick={() => setDeleteTarget(appointment)}
                        className="hover:bg-rose-500/10 hover:text-rose-300"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo agendamento" size="lg">
        <AdminAppointmentForm
          services={services}
          professionals={professionals}
          onCreated={handleCreated}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reagendar"
        size="lg"
      >
        {rescheduleTarget && (
          <RescheduleForm
            appointment={rescheduleTarget}
            onRescheduled={handleRescheduled}
            onCancel={() => setRescheduleTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir agendamento?"
        description="Esta ação remove o agendamento permanentemente e não pode ser desfeita."
        confirmLabel="Excluir"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  className,
}: {
  label: string;
  icon: typeof CheckCircle2;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-ink-muted transition-colors disabled:opacity-40 ${className ?? ''}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
