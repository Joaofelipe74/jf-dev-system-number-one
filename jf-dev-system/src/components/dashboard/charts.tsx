'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

const CHART_COLORS = ['#00A8FF', '#8B5CF6', '#00C2FF', '#6C5CE7', '#3B82F6'];

const axisStyle = { fontSize: 11, fill: '#94A3B8' };

type ChartTooltipProps = Pick<TooltipProps<ValueType, NameType>, 'active' | 'payload' | 'label'> & {
  /** Formata o valor exibido no tooltip. Nomeado diferente de `formatter` de propósito:
   *  o `formatter` nativo do Recharts tem uma assinatura própria (value, name, item, index,
   *  payload) — reaproveitar o mesmo nome aqui quebrava a checagem de tipos (TS2430) quando
   *  este componente era usado como `content` de <Tooltip />. */
  valueFormatter?: (value: number) => string;
};

function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-xs shadow-card">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {valueFormatter && typeof entry.value === 'number'
            ? valueFormatter(entry.value)
            : String(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: DashboardSummary['revenueBySeries'] }) {
  const hasData = data.some((d) => d.valueCents > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento (7 dias)</CardTitle>
        <CardDescription>Receita de atendimentos concluídos.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A8FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00A8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatCurrency(v)} />} />
              <Area
                type="monotone"
                dataKey="valueCents"
                stroke="#00A8FF"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Sem faturamento no período" description="Os dados aparecem assim que houver atendimentos concluídos." />
        )}
      </CardContent>
    </Card>
  );
}

export function AppointmentsChart({ data }: { data: DashboardSummary['appointmentsBySeries'] }) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos (7 dias)</CardTitle>
        <CardDescription>Volume diário de agendamentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Sem agendamentos no período" description="Novos agendamentos aparecerão aqui automaticamente." />
        )}
      </CardContent>
    </Card>
  );
}

export function TopServicesChart({ data }: { data: DashboardSummary['topServices'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços mais utilizados</CardTitle>
        <CardDescription>Distribuição dos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Sem dados de serviços" description="Os serviços mais pedidos aparecerão aqui." />
        )}
        {data.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {data.map((item, i) => (
              <li key={item.name} className="flex items-center gap-2 text-xs text-ink-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {item.name} <span className="ml-auto text-ink">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfessionalsChart({ data }: { data: DashboardSummary['byProfessional'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimentos por profissional</CardTitle>
        <CardDescription>Últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="#00C2FF" radius={[0, 6, 6, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Sem dados de profissionais" description="O desempenho de cada profissional aparecerá aqui." />
        )}
      </CardContent>
    </Card>
  );
}

export function MonthlyEvolutionChart({ data }: { data: DashboardSummary['monthlyEvolution'] }) {
  const hasData = data.some((d) => d.revenueCents > 0 || d.appointments > 0);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Evolução mensal</CardTitle>
        <CardDescription>Faturamento e volume de atendimentos nos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatCurrency(v)} />} />
              <Line
                type="monotone"
                dataKey="revenueCents"
                name="Faturamento"
                stroke="#00A8FF"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                name="Atendimentos"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Sem histórico suficiente" description="A evolução mensal aparecerá conforme os atendimentos acontecem." />
        )}
      </CardContent>
    </Card>
  );
}
