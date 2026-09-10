'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  Users2,
  UserCog,
  Scissors,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarClock },
  { href: '/admin/clientes', label: 'Clientes', icon: Users2 },
  { href: '/admin/profissionais', label: 'Profissionais', icon: UserCog },
  { href: '/admin/servicos', label: 'Serviços', icon: Scissors },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      showToast('error', 'Não foi possível sair. Tente novamente.');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-electric to-violet-neon text-sm font-black text-white">
            JF
          </span>
          <span className="text-ink">JF DEV</span>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-ink-muted hover:bg-white/5 hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegação administrativa">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-electric/10 text-blue-neon'
                  : 'text-ink-muted hover:bg-white/5 hover:text-ink'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-soft p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
          Sair
        </button>
      </div>
    </div>
  );
}
