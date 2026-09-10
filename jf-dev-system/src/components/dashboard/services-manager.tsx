'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Label, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { serviceSchema, flattenZodErrors, type ServiceInput } from '@/lib/validation';
import type { ServiceDTO, ProfessionalDTO } from '@/types';

interface ServicesManagerProps {
  initialServices: ServiceDTO[];
  professionals: ProfessionalDTO[];
}

const EMPTY_FORM: ServiceInput = {
  name: '',
  description: '',
  priceCents: 0,
  durationMinutes: 30,
  isActive: true,
  professionalIds: [],
};

export function ServicesManager({ initialServices, professionals }: ServicesManagerProps) {
  const { showToast } = useToast();
  const [services, setServices] = useState(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [form, setForm] = useState<ServiceInput>(EMPTY_FORM);
  const [priceInput, setPriceInput] = useState('0,00');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const professionalsById = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals]
  );

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPriceInput('0,00');
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(service: ServiceDTO) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description ?? '',
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
      professionalIds: service.professionalIds,
    });
    setPriceInput((service.priceCents / 100).toFixed(2).replace('.', ','));
    setErrors({});
    setModalOpen(true);
  }

  function toggleProfessional(id: string) {
    setForm((prev) => ({
      ...prev,
      professionalIds: prev.professionalIds.includes(id)
        ? prev.professionalIds.filter((p) => p !== id)
        : [...prev.professionalIds, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = serviceSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      if (editing) {
        const { service } = await apiFetch<{ service: ServiceDTO }>(`/api/services/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
        setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
        showToast('success', 'Serviço atualizado com sucesso.');
      } else {
        const { service } = await apiFetch<{ service: ServiceDTO }>('/api/services', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        setServices((prev) => [service, ...prev]);
        showToast('success', 'Serviço criado com sucesso.');
      }
      setModalOpen(false);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao salvar o serviço.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(service: ServiceDTO) {
    const nextActive = !service.isActive;
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: nextActive } : s)));
    try {
      await apiFetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });
      showToast('success', nextActive ? 'Serviço ativado.' : 'Serviço desativado.');
    } catch {
      setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
      showToast('error', 'Não foi possível atualizar o status do serviço.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/services/${deleteTarget.id}`, { method: 'DELETE' });
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showToast('success', 'Serviço excluído.');
      setDeleteTarget(null);
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao excluir o serviço.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Serviços</h1>
          <p className="text-sm text-ink-muted">Gerencie o catálogo de serviços oferecidos.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço cadastrado"
          description="Crie o primeiro serviço para começar a receber agendamentos."
          action={
            <Button onClick={openCreateModal} size="sm" className="mt-2">
              <Plus className="h-4 w-4" /> Novo serviço
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{service.name}</h3>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2">{service.description}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    service.isActive
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-border-soft bg-surface-elevated text-ink-muted'
                  }`}
                >
                  {service.isActive ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="font-semibold text-blue-neon">{formatCurrency(service.priceCents)}</span>
                <span className="text-ink-muted">{formatDuration(service.durationMinutes)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {service.professionalIds.length === 0 && (
                  <span className="text-xs text-ink-muted">Nenhum profissional vinculado</span>
                )}
                {service.professionalIds.slice(0, 3).map((id) => (
                  <span key={id} className="rounded-full bg-surface-elevated px-2 py-0.5 text-[11px] text-ink-muted">
                    {professionalsById.get(id)?.name ?? 'Profissional'}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border-soft pt-4">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditModal(service)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(service)}>
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
        title={editing ? 'Editar serviço' : 'Novo serviço'}
        description="Preencha as informações do serviço."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="service-name">Nome do serviço</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
          </div>
          <div>
            <Label htmlFor="service-description">Descrição</Label>
            <Textarea
              id="service-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={errors.description}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="service-price">Preço (R$)</Label>
              <Input
                id="service-price"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setPriceInput(raw);
                  const numeric = Number(raw.replace(/\./g, '').replace(',', '.'));
                  setForm((f) => ({ ...f, priceCents: Number.isFinite(numeric) ? Math.round(numeric * 100) : 0 }));
                }}
                placeholder="0,00"
                error={errors.priceCents}
              />
            </div>
            <div>
              <Label htmlFor="service-duration">Duração (minutos)</Label>
              <Input
                id="service-duration"
                type="number"
                min={5}
                step={5}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                error={errors.durationMinutes}
              />
            </div>
          </div>

          <div>
            <Label>Profissionais que realizam este serviço</Label>
            <div className="flex flex-wrap gap-2">
              {professionals.length === 0 && (
                <p className="text-xs text-ink-muted">Cadastre profissionais para vinculá-los aqui.</p>
              )}
              {professionals.map((professional) => {
                const selected = form.professionalIds.includes(professional.id);
                return (
                  <button
                    type="button"
                    key={professional.id}
                    onClick={() => toggleProfessional(professional.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-blue-electric bg-blue-electric/15 text-blue-neon'
                        : 'border-border-soft text-ink-muted hover:text-ink'
                    }`}
                  >
                    {professional.name}
                  </button>
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
            Serviço ativo (visível no agendamento público)
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSaving}>
              {editing ? 'Salvar alterações' : 'Criar serviço'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir serviço?"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
