'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { getInitials, maskPhone } from '@/lib/utils';
import { professionalSchema, flattenZodErrors, type ProfessionalInput } from '@/lib/validation';
import { WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import type { ProfessionalDTO, ServiceDTO } from '@/types';

interface ProfessionalsManagerProps {
  initialProfessionals: ProfessionalDTO[];
  services: ServiceDTO[];
}

const AVATAR_COLORS = ['#00A8FF', '#8B5CF6', '#00C2FF', '#6C5CE7', '#3B82F6', '#F472B6'];
const WORK_DAYS = [1, 2, 3, 4, 5, 6];

function emptyForm(): ProfessionalInput {
  return {
    name: '',
    specialty: '',
    phone: '',
    email: '',
    isActive: true,
    avatarColor: AVATAR_COLORS[0]!,
    serviceIds: [],
    workingHours: WORK_DAYS.map((weekday) => ({ weekday, startTime: '09:00', endTime: '19:00' })),
  };
}

export function ProfessionalsManager({ initialProfessionals, services }: ProfessionalsManagerProps) {
  const { showToast } = useToast();
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProfessionalDTO | null>(null);
  const [form, setForm] = useState<ProfessionalInput>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfessionalDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openCreateModal() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(professional: ProfessionalDTO) {
    setEditing(professional);
    const hoursByWeekday = new Map(professional.workingHours.map((h) => [h.weekday, h]));
    setForm({
      name: professional.name,
      specialty: professional.specialty,
      phone: maskPhone(professional.phone),
      email: professional.email,
      isActive: professional.isActive,
      avatarColor: professional.avatarColor,
      serviceIds: professional.serviceIds,
      workingHours: WORK_DAYS.map(
        (weekday) => hoursByWeekday.get(weekday) ?? { weekday, startTime: '09:00', endTime: '19:00' }
      ),
    });
    setErrors({});
    setModalOpen(true);
  }

  function toggleService(id: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((s) => s !== id)
        : [...prev.serviceIds, id],
    }));
  }

  function toggleWorkday(weekday: number) {
    setForm((prev) => {
      const exists = prev.workingHours.some((h) => h.weekday === weekday);
      return {
        ...prev,
        workingHours: exists
          ? prev.workingHours.filter((h) => h.weekday !== weekday)
          : [...prev.workingHours, { weekday, startTime: '09:00', endTime: '19:00' }],
      };
    });
  }

  function updateWorkday(weekday: number, field: 'startTime' | 'endTime', value: string) {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((h) => (h.weekday === weekday ? { ...h, [field]: value } : h)),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = professionalSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      if (editing) {
        const { professional } = await apiFetch<{ professional: ProfessionalDTO }>(
          `/api/professionals/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(parsed.data) }
        );
        setProfessionals((prev) => prev.map((p) => (p.id === professional.id ? professional : p)));
        showToast('success', 'Profissional atualizado com sucesso.');
      } else {
        const { professional } = await apiFetch<{ professional: ProfessionalDTO }>('/api/professionals', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        setProfessionals((prev) => [professional, ...prev]);
        showToast('success', 'Profissional cadastrado com sucesso.');
      }
      setModalOpen(false);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao salvar o profissional.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(professional: ProfessionalDTO) {
    const nextActive = !professional.isActive;
    setProfessionals((prev) => prev.map((p) => (p.id === professional.id ? { ...p, isActive: nextActive } : p)));
    try {
      await apiFetch(`/api/professionals/${professional.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });
      showToast('success', nextActive ? 'Profissional ativado.' : 'Profissional desativado.');
    } catch {
      setProfessionals((prev) => prev.map((p) => (p.id === professional.id ? professional : p)));
      showToast('error', 'Não foi possível atualizar o status.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/professionals/${deleteTarget.id}`, { method: 'DELETE' });
      setProfessionals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast('success', 'Profissional excluído.');
      setDeleteTarget(null);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao excluir o profissional.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Profissionais</h1>
          <p className="text-sm text-ink-muted">Gerencie a equipe e os horários de trabalho.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Novo profissional
        </Button>
      </div>

      {professionals.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum profissional cadastrado"
          description="Cadastre o primeiro profissional para começar a montar a agenda."
          action={
            <Button onClick={openCreateModal} size="sm" className="mt-2">
              <Plus className="h-4 w-4" /> Novo profissional
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <Card key={professional.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: professional.avatarColor }}
                  >
                    {getInitials(professional.name)}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">{professional.name}</h3>
                    <p className="text-xs text-ink-muted">{professional.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(professional)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    professional.isActive
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-border-soft bg-surface-elevated text-ink-muted'
                  }`}
                >
                  {professional.isActive ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="mt-4 space-y-1 text-xs text-ink-muted">
                <p>{maskPhone(professional.phone)}</p>
                <p className="truncate">{professional.email}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {professional.workingHours.map((h) => (
                  <span key={h.weekday} className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-blue-neon">
                    {WEEKDAY_SHORT_LABELS[h.weekday]}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border-soft pt-4">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditModal(professional)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(professional)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar profissional' : 'Novo profissional'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prof-name">Nome completo</Label>
              <Input
                id="prof-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
              />
            </div>
            <div>
              <Label htmlFor="prof-specialty">Especialidade</Label>
              <Input
                id="prof-specialty"
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                error={errors.specialty}
              />
            </div>
            <div>
              <Label htmlFor="prof-phone">Telefone</Label>
              <Input
                id="prof-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                error={errors.phone}
              />
            </div>
            <div>
              <Label htmlFor="prof-email">E-mail</Label>
              <Input
                id="prof-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={errors.email}
              />
            </div>
          </div>

          <div>
            <Label>Cor de identificação</Label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, avatarColor: color }))}
                  style={{ backgroundColor: color }}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    form.avatarColor === color ? 'scale-110 ring-2 ring-white/60 ring-offset-2 ring-offset-surface' : ''
                  }`}
                  aria-label={`Selecionar cor ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Serviços realizados</Label>
            <div className="flex flex-wrap gap-2">
              {services.length === 0 && <p className="text-xs text-ink-muted">Cadastre serviços para vinculá-los aqui.</p>}
              {services.map((service) => {
                const selected = form.serviceIds.includes(service.id);
                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-blue-electric bg-blue-electric/15 text-blue-neon'
                        : 'border-border-soft text-ink-muted hover:text-ink'
                    }`}
                  >
                    {service.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Dias e horários de trabalho</Label>
            <div className="space-y-2">
              {WORK_DAYS.map((weekday) => {
                const entry = form.workingHours.find((h) => h.weekday === weekday);
                return (
                  <div key={weekday} className="flex flex-wrap items-center gap-2 rounded-lg border border-border-soft p-2.5">
                    <label className="flex w-28 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={!!entry}
                        onChange={() => toggleWorkday(weekday)}
                        className="h-4 w-4 rounded border-border-soft bg-surface-elevated accent-blue-500"
                      />
                      {WEEKDAY_SHORT_LABELS[weekday]}
                    </label>
                    {entry && (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateWorkday(weekday, 'startTime', e.target.value)}
                          className="w-auto"
                        />
                        <span className="text-xs text-ink-muted">até</span>
                        <Input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateWorkday(weekday, 'endTime', e.target.value)}
                          className="w-auto"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-border-soft bg-surface-elevated accent-blue-500"
            />
            Profissional ativo
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSaving}>
              {editing ? 'Salvar alterações' : 'Cadastrar profissional'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir profissional?"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
