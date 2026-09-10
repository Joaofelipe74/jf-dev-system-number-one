import type { ReactNode } from 'react';
import { getCurrentSession } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();

  // A tela de login não usa este shell (nem exige sessão) — ver src/app/admin/login/page.tsx,
  // que é renderizada fora deste layout através do próprio middleware.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-72 shrink-0 border-r border-border-soft bg-bg-secondary lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={session.name || session.email} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
