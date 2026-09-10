'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/sidebar';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dates';
import { AnimatePresence, motion } from 'framer-motion';

interface TopbarProps {
  userName: string;
}

interface SearchResults {
  clients: { id: string; name: string; phone: string }[];
  appointments: { id: string; clientName: string; serviceName: string; startsAt: string }[];
}

/**
 * CORREÇÕES desta auditoria:
 * - A busca era decorativa (nenhum estado, nenhuma chamada de API) — agora
 *   consulta `/api/search` de verdade e mostra clientes/agendamentos reais.
 * - O sino de notificações não tinha NENHUMA notificação real por trás
 *   (nenhuma fila, nenhum evento) — era só um ícone com uma bolinha
 *   sempre acesa. Como não há um sistema de notificações real neste
 *   projeto, o botão foi removido em vez de manter um controle decorativo
 *   ("sem botões decorativos" é um requisito explícito da correção).
 */
export function Topbar({ userName }: TopbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(() => {
      apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(setResults)
        .catch(() => setResults(null))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const hasResults = results && (results.clients.length > 0 || results.appointments.length > 0);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-soft bg-bg/90 px-4 backdrop-blur-xl sm:px-6">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-ink lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div ref={containerRef} className="relative hidden max-w-sm flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="global-search-results"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Pesquisar clientes, agendamentos..."
            className="h-10 w-full rounded-xl border border-border-soft bg-surface-elevated pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted/60 focus:border-blue-electric/50 focus:outline-none focus:ring-2 focus:ring-blue-electric/30"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
          )}

          <AnimatePresence>
            {isOpen && query.trim().length >= 2 && (
              <motion.div
                id="global-search-results"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border-soft bg-surface p-2 shadow-card-hover"
              >
                {!hasResults && !isSearching && (
                  <p className="p-3 text-center text-xs text-ink-muted">Nenhum resultado para &quot;{query}&quot;.</p>
                )}
                {results && results.clients.length > 0 && (
                  <div className="mb-1">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      Clientes
                    </p>
                    {results.clients.map((client) => (
                      <Link
                        key={client.id}
                        href="/admin/clientes"
                        onClick={() => setIsOpen(false)}
                        className="block rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-white/5"
                      >
                        {client.name} <span className="text-xs text-ink-muted">· {client.phone}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {results && results.appointments.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      Agendamentos
                    </p>
                    {results.appointments.map((appt) => (
                      <Link
                        key={appt.id}
                        href="/admin/agendamentos"
                        onClick={() => setIsOpen(false)}
                        className="block rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-white/5"
                      >
                        {appt.clientName} · {appt.serviceName}
                        <span className="ml-1 text-xs text-ink-muted">({formatDateTime(appt.startsAt)})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-electric to-violet-neon text-xs font-bold text-white">
            {getInitials(userName || 'Admin')}
          </span>
          <span className="hidden text-sm font-medium text-ink sm:block">{userName}</span>
        </div>
      </header>

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-72 border-r border-border-soft bg-bg-secondary"
            >
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
