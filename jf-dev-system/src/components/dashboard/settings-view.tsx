'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { WEEKDAY_LABELS } from '@/lib/constants';
import { settingsSchema, flattenZodErrors, type SettingsInput } from '@/lib/validation';
import type { BusinessHourDTO } from '@/types';

interface SettingsViewProps {
  initialBusinessHours: BusinessHourDTO[];
  initialSettings: SettingsInput;
}

export function SettingsView({ initialBusinessHours, initialSettings }: SettingsViewProps) {
  const { showToast } = useToast();
  const [hours, setHours] = useState<BusinessHourDTO[]>(
    Array.from({ length: 7 }, (_, weekday) => {
      const existing = initialBusinessHours.find((h) => h.weekday === weekday);
      return existing ?? { weekday, isOpen: weekday !== 0, startTime: '09:00', endTime: '19:00' };
    })
  );
  const [settings, setSettings] = useState(initialSettings);
  const [savingHours, setSavingHours] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateHour(weekday: number, patch: Partial<BusinessHourDTO>) {
    setHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  async function saveHours() {
    setSavingHours(true);
    try {
      await Promise.all(
        hours.map((hour) =>
          apiFetch('/api/business-hours', { method: 'PUT', body: JSON.stringify(hour) })
        )
      );
      showToast('success', 'Horário de funcionamento atualizado.');
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao salvar horários.');
    } finally {
      setSavingHours(false);
    }
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setSavingSettings(true);
    try {
      await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(parsed.data) });
      showToast('success', 'Configurações salvas com sucesso.');
    } catch (error) {
      showToast('error', error instanceof ApiRequestError ? error.message : 'Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Horário de funcionamento e parâmetros do agendamento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horário de funcionamento</CardTitle>
          <CardDescription>Define os dias e horários em que o negócio aceita agendamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {hours.map((hour) => (
            <div key={hour.weekday} className="flex flex-wrap items-center gap-3 rounded-lg border border-border-soft p-3">
              <label className="flex w-36 items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={hour.isOpen}
                  onChange={(e) => updateHour(hour.weekday, { isOpen: e.target.checked })}
                  className="h-4 w-4 rounded border-border-soft bg-surface-elevated accent-blue-500"
                />
                {WEEKDAY_LABELS[hour.weekday]}
              </label>
              {hour.isOpen ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    value={hour.startTime}
                    onChange={(e) => updateHour(hour.weekday, { startTime: e.target.value })}
                    className="w-auto"
                  />
                  <span className="text-xs text-ink-muted">até</span>
                  <Input
                    type="time"
                    value={hour.endTime}
                    onChange={(e) => updateHour(hour.weekday, { endTime: e.target.value })}
                    className="w-auto"
                  />
                </div>
              ) : (
                <span className="text-xs text-ink-muted">Fechado</span>
              )}
            </div>
          ))}
          <div className="pt-2">
            <Button onClick={saveHours} isLoading={savingHours}>
              <Save className="h-4 w-4" /> Salvar horários
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do agendamento</CardTitle>
          <CardDescription>Controle o intervalo entre horários e a janela de agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="slot-interval">Intervalo entre horários (min)</Label>
                <Input
                  id="slot-interval"
                  type="number"
                  min={5}
                  step={5}
                  value={settings.slotIntervalMinutes}
                  onChange={(e) => setSettings((s) => ({ ...s, slotIntervalMinutes: Number(e.target.value) }))}
                  error={errors.slotIntervalMinutes}
                />
              </div>
              <div>
                <Label htmlFor="booking-window">Janela de agendamento (dias)</Label>
                <Input
                  id="booking-window"
                  type="number"
                  min={1}
                  value={settings.bookingWindowDays}
                  onChange={(e) => setSettings((s) => ({ ...s, bookingWindowDays: Number(e.target.value) }))}
                  error={errors.bookingWindowDays}
                />
              </div>
              <div>
                <Label htmlFor="cancellation-window">Prazo de cancelamento (horas)</Label>
                <Input
                  id="cancellation-window"
                  type="number"
                  min={0}
                  value={settings.cancellationWindowHours}
                  onChange={(e) => setSettings((s) => ({ ...s, cancellationWindowHours: Number(e.target.value) }))}
                  error={errors.cancellationWindowHours}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsapp-number">
                Número do WhatsApp para confirmações (opcional, preparado para integração futura)
              </Label>
              <Input
                id="whatsapp-number"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))}
                placeholder="5511999999999"
              />
            </div>
            <Button type="submit" isLoading={savingSettings}>
              <Save className="h-4 w-4" /> Salvar configurações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
