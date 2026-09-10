'use client';

import { useState } from 'react';
import { Input, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import type { ProfessionalDTO } from '@/types';

interface BlockTimeFormProps {
  professionals: ProfessionalDTO[];
  defaultDate?: string; // YYYY-MM-DD
  onCreated: () => void;
  onCancel: () => void;
}

export function BlockTimeForm({ professionals, defaultDate, onCreated, onCancel }: BlockTimeFormProps) {
  const [professionalId, setProfessionalId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? '');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title || !date || !startTime || !endTime) {
      setError('Preencha todos os campos.');
      return;
    }

    const startsAt = new Date(`${date}T${startTime}:00`);
    const endsAt = new Date(`${date}T${endTime}:00`);
    if (endsAt <= startsAt) {
      setError('O término deve ser depois do início.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/blocked-times', {
        method: 'POST',
        body: JSON.stringify({
          professionalId: professionalId || null,
          title,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível criar o bloqueio.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="block-title">Título do bloqueio</Label>
        <Input
          id="block-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Folga, feriado, compromisso pessoal"
        />
      </div>
      <div>
        <Label htmlFor="block-professional">Profissional</Label>
        <Select id="block-professional" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
          <option value="">Todo o negócio (todos os profissionais)</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="block-date">Data</Label>
        <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="block-start">Início</Label>
          <Input id="block-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="block-end">Término</Label>
          <Input id="block-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
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
          Bloquear horário
        </Button>
      </div>
    </form>
  );
}
