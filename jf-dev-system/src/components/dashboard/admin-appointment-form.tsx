'use client';

import { useEffect, useState } from 'react';
import { Input, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { maskPhone, formatCurrency, formatDuration } from '@/lib/utils';
import { toISODateString } from '@/utils/dates';
import type { ServiceDTO, ProfessionalDTO } from '@/types';

interface Slot {
  iso: string;
  label: string;
}

interface AdminAppointmentFormProps {
  services: ServiceDTO[];
  professionals: ProfessionalDTO[];
  defaultDate?: Date;
  onCreated: () => void;
  onCancel: () => void;
}

/** Formulário usado pelo administrador para criar um agendamento manualmente (mesma regra de disponibilidade do site público). */
export function AdminAppointmentForm({
  services,
  professionals,
  defaultDate,
  onCreated,
  onCancel,
}: AdminAppointmentFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(toISODateString(defaultDate ?? new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotIso, setSlotIso] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableProfessionals = professionals.filter(
    (p) => p.isActive && p.serviceIds.includes(serviceId)
  );

  useEffect(() => {
    if (!availableProfessionals.some((p) => p.id === professionalId)) {
      setProfessionalId(availableProfessionals[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !professionalId || !date) {
      setSlots(null);
      return;
    }
    setSlots(null);
    setSlotIso('');
    apiFetch<{ slots: Slot[] }>(
      `/api/availability?serviceId=${serviceId}&professionalId=${professionalId}&date=${date}`
    )
      .then((data) => setSlots(data.slots))
      .catch(() => setSlots([]));
  }, [serviceId, professionalId, date]);

  const service = services.find((s) => s.id === serviceId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!serviceId || !professionalId || !slotIso || !name || !phone) {
      setError('Preencha todos os campos obrigatórios e selecione um horário.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          professionalId,
          startsAt: slotIso,
          client: { name, phone, email: email || undefined },
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível criar o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin-appt-service">Serviço</Label>
          <Select id="admin-appt-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {service && (
            <p className="mt-1 text-xs text-ink-muted">
              {formatCurrency(service.priceCents)} · {formatDuration(service.durationMinutes)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="admin-appt-professional">Profissional</Label>
          <Select
            id="admin-appt-professional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            {availableProfessionals.length === 0 && <option value="">Nenhum disponível</option>}
            {availableProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin-appt-date">Data</Label>
          <Input id="admin-appt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="admin-appt-slot">Horário</Label>
          <Select id="admin-appt-slot" value={slotIso} onChange={(e) => setSlotIso(e.target.value)}>
            <option value="">
              {slots === null ? 'Carregando...' : slots.length === 0 ? 'Sem horários disponíveis' : 'Selecione'}
            </option>
            {slots?.map((slot) => (
              <option key={slot.iso} value={slot.iso}>
                {slot.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin-appt-name">Nome do cliente</Label>
          <Input id="admin-appt-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="admin-appt-phone">Telefone</Label>
          <Input id="admin-appt-phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        </div>
      </div>
      <div>
        <Label htmlFor="admin-appt-email">E-mail (opcional)</Label>
        <Input id="admin-appt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
          Criar agendamento
        </Button>
      </div>
    </form>
  );
}
