'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Users2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Label, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { getInitials, maskPhone } from '@/lib/utils';
import { formatDateTime } from '@/utils/dates';
import { clientSchema, flattenZodErrors, type ClientInput } from '@/lib/validation';
import type { ClientDTO, AppointmentDTO } from '@/types';

interface ClientsManagerProps {
  initialClients: ClientDTO[];
}

const EMPTY_FORM: ClientInput = { name: '', phone: '', email: '', notes: '' };

export function ClientsManager({ initialClients }: ClientsManagerProps) {
  const { showToast } = useToast();
  const [clients, setClients] = useState(initialClients);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDTO | null>(null);
  const [form, setForm] = useState<ClientInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyClient, setHistoryClient] = useState<ClientDTO | null>(null);
  const [history, setHistory] = useState<AppointmentDTO[] | null>(null);

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(client: ClientDTO) {
    setEditing(client);
    setForm({ name: client.name, phone: maskPhone(client.phone), email: client.email ?? '', notes: client.notes ?? '' });
    setErrors({});
    setModalOpen(true);
  }

  async function openHistory(client: ClientDTO) {
    setHistoryClient(client);
    setHistory(null);
    try {
      const data = await apiFetch<{ appointments: AppointmentDTO[] }>(`/api/clients/${client.id}`);
      setHistory(data.appointments);
    } catch {
      showToast('error', 'Não foi possível carregar o histórico deste cliente.');
      setHistory([]);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      if (editing) {
        const { client } = await apiFetch<{ client: ClientDTO }>(`/api/clients/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
        setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
        showToast('success', 'Cliente atualizado com sucesso.');
      } else {
        const { client } = await apiFetch<{ client: ClientDTO }>('/api/clients', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        setClients((prev) => [client, ...prev]);
        showToast('success', 'Cliente cadastrado com sucesso.');
      }
      setModalOpen(false);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/clients/${deleteTarget.id}`, { method: 'DELETE' });
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast('success', 'Cliente excluído.');
      setDeleteTarget(null);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao excluir o cliente.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-sm text-ink-muted">Cadastro e histórico de atendimentos.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Nenhum cliente cadastrado"
          description="Os clientes cadastrados pelo agendamento público também aparecerão aqui."
          action={
            <Button onClick={openCreateModal} size="sm" className="mt-2">
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3.5 font-medium">Cliente</th>
                <th className="px-5 py-3.5 font-medium">Contato</th>
                <th className="px-5 py-3.5 font-medium">Atendimentos</th>
                <th className="px-5 py-3.5 font-medium">Último atendimento</th>
                <th className="px-5 py-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border-soft last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-blue-neon">
                        {getInitials(client.name)}
                      </span>
                      <span className="font-medium text-ink">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">
                    <div>{maskPhone(client.phone)}</div>
                    {client.email && <div className="text-xs">{client.email}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{client.appointmentsCount}</td>
                  <td className="px-5 py-3.5 text-ink-muted">
                    {client.lastAppointmentAt ? formatDateTime(client.lastAppointmentAt) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openHistory(client)}
                        aria-label="Ver histórico"
                        className="rounded-lg p-2 text-ink-muted hover:bg-white/5 hover:text-blue-neon"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        aria-label="Editar cliente"
                        className="rounded-lg p-2 text-ink-muted hover:bg-white/5 hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(client)}
                        aria-label="Excluir cliente"
                        className="rounded-lg p-2 text-ink-muted hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="client-name">Nome completo</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                error={errors.phone}
              />
            </div>
            <div>
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={errors.email}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="client-notes">Observações</Label>
            <Textarea
              id="client-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              error={errors.notes}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSaving}>
              {editing ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!historyClient}
        onClose={() => setHistoryClient(null)}
        title={`Histórico de ${historyClient?.name ?? ''}`}
        size="lg"
      >
        {!history ? (
          <SkeletonRows rows={3} />
        ) : history.length === 0 ? (
          <EmptyState title="Nenhum atendimento registrado" description="Os agendamentos deste cliente aparecerão aqui." />
        ) : (
          <ul className="space-y-2">
            {history.map((appointment) => (
              <li
                key={appointment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-soft p-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{appointment.serviceName}</p>
                  <p className="text-xs text-ink-muted">
                    {appointment.professionalName} · {formatDateTime(appointment.startsAt)}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir cliente?"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
