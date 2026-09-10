'use client';

import { useState } from 'react';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { clientSchema, flattenZodErrors } from '@/lib/validation';
import { maskPhone } from '@/lib/utils';

export interface ClientDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface StepDetailsProps {
  initialValues: ClientDetails;
  onSubmit: (details: ClientDetails) => void;
}

export function StepDetails({ initialValues, onSubmit }: StepDetailsProps) {
  const [values, setValues] = useState<ClientDetails>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = clientSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="client-name">Nome completo</Label>
        <Input
          id="client-name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="Como podemos te chamar?"
          error={errors.name}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client-phone">Telefone / WhatsApp</Label>
          <Input
            id="client-phone"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: maskPhone(e.target.value) }))}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            error={errors.phone}
          />
        </div>
        <div>
          <Label htmlFor="client-email">E-mail (opcional)</Label>
          <Input
            id="client-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            placeholder="voce@email.com"
            error={errors.email}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="client-notes">Observações (opcional)</Label>
        <Textarea
          id="client-notes"
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          placeholder="Alguma preferência ou informação importante?"
          error={errors.notes}
        />
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Continuar
      </Button>
    </form>
  );
}
