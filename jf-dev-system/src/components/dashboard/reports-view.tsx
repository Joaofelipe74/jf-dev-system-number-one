'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { formatDateTime } from '@/utils/dates';
import { STATUS_LABELS } from '@/lib/constants';
import {
  RevenueChart,
  AppointmentsChart,
  TopServicesChart,
  ProfessionalsChart,
  MonthlyEvolutionChart,
} from '@/components/dashboard/charts';
import type { AppointmentDTO, DashboardSummary } from '@/types';

interface ReportsViewProps {
  summary: DashboardSummary;
  appointments: AppointmentDTO[];
}

/**
 * Neutraliza injeção de fórmula em CSV (CSV/Formula Injection): se uma
 * célula começar com `=`, `+`, `-`, `@`, tab ou retorno de carro, Excel e
 * Google Sheets podem interpretá-la como uma fórmula ao abrir o arquivo —
 * um vetor conhecido de ataque quando dados digitados por clientes (nome,
 * observações) acabam em um CSV exportado. A mitigação recomendada (OWASP)
 * é prefixar esses valores com um apóstrofo, forçando a célula a ser
 * tratada como texto.
 */
function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function exportCsv(appointments: AppointmentDTO[]) {
  const header = ['Data', 'Cliente', 'Telefone', 'Servico', 'Profissional', 'Valor', 'Status'];
  const rows = appointments.map((a) => [
    formatDateTime(a.startsAt),
    a.clientName,
    a.clientPhone,
    a.serviceName,
    a.professionalName,
    (a.priceCents / 100).toFixed(2).replace('.', ','),
    STATUS_LABELS[a.status],
  ]);
  const csvContent = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${sanitizeCsvCell(String(cell)).replace(/"/g, '""')}"`)
        .join(';')
    )
    .join('\n');

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-agendamentos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsView({ summary, appointments }: ReportsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Relatórios</h1>
          <p className="text-sm text-ink-muted">Métricas detalhadas dos últimos 6 meses.</p>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(appointments)} disabled={appointments.length === 0}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={summary.revenueBySeries} />
        <AppointmentsChart data={summary.appointmentsBySeries} />
        <TopServicesChart data={summary.topServices} />
        <ProfessionalsChart data={summary.byProfessional} />
        <MonthlyEvolutionChart data={summary.monthlyEvolution} />
      </div>

      <Card>
        <div className="border-b border-border-soft p-5">
          <h2 className="font-display text-base font-semibold text-ink">Agendamentos (últimos 6 meses)</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nenhum agendamento no período" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Serviço</th>
                  <th className="px-5 py-3 font-medium">Profissional</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 50).map((a) => (
                  <tr key={a.id} className="border-b border-border-soft last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-ink">{formatDateTime(a.startsAt)}</td>
                    <td className="px-5 py-3 text-ink-muted">{a.clientName}</td>
                    <td className="px-5 py-3 text-ink-muted">{a.serviceName}</td>
                    <td className="px-5 py-3 text-ink-muted">{a.professionalName}</td>
                    <td className="px-5 py-3 text-ink-muted">{formatCurrency(a.priceCents)}</td>
                    <td className="px-5 py-3 text-ink-muted">{STATUS_LABELS[a.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length > 50 && (
              <p className="p-4 text-center text-xs text-ink-muted">
                Mostrando 50 de {appointments.length} agendamentos. Exporte o CSV para ver todos.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
