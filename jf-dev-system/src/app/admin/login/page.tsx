import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { LoginForm } from '@/components/dashboard/login-form';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Acesso administrativo',
  description: `Painel administrativo do sistema desenvolvido pela ${siteConfig.brand.name}.`,
};

export default async function AdminLoginPage() {
  const session = await getCurrentSession();
  if (session) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg bg-grid-glow px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-electric to-violet-neon text-lg font-black text-white shadow-glow-blue-sm">
            JF
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Painel administrativo</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {siteConfig.demoBusiness.name} · desenvolvido pela {siteConfig.brand.name}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
