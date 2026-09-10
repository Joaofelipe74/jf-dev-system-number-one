'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, KeyRound, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { loginSchema, flattenZodErrors } from '@/lib/validation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setGeneralError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      const next = searchParams.get('next') || '/admin';
      router.push(next);
      router.refresh();
    } catch (error) {
      setGeneralError(
        error instanceof ApiRequestError ? error.message : 'Não foi possível entrar. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="glow-border">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="login-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@seudominio.com.br"
                className="pl-10"
                error={errors.email}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                error={errors.password}
              />
            </div>
          </div>

          {generalError && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-300">
              {generalError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
        </form>

        <p className="mt-6 rounded-lg border border-border-soft bg-surface-elevated/60 px-4 py-3 text-xs text-ink-muted">
          Ambiente de demonstração: <strong className="text-ink">admin@studionovaera.com.br</strong> ·
          senha <strong className="text-ink">JfDev@2026</strong> (criado por{' '}
          <code className="text-blue-neon">npm run db:seed</code>).
        </p>
      </CardContent>
    </Card>
  );
}
