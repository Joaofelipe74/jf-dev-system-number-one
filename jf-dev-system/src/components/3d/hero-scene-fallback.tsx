'use client';

/**
 * Versão CSS/SVG da composição 3D do hero — usada automaticamente quando:
 *  - o usuário pede "prefers-reduced-motion"；
 *  - o dispositivo é classificado como de baixa performance (poucos núcleos/memória);
 *  - o WebGL não está disponível no navegador.
 * Mantém a MESMA identidade visual (dark + azul elétrico + roxo), só que
 * usando apenas transformações CSS leves em vez de WebGL.
 */
export function HeroSceneFallback() {
  return (
    <div className="relative flex h-[420px] w-full items-center justify-center sm:h-[480px] lg:h-[560px]">
      <div className="absolute h-64 w-64 rounded-full bg-blue-electric/20 blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute right-4 top-6 h-40 w-40 rounded-full bg-violet-neon/20 blur-3xl" />

      {/* "Notebook" com dashboard */}
      <div className="animate-float-slow relative z-10 w-[280px] rounded-2xl border border-border-soft bg-surface-elevated/90 p-3 shadow-glow-blue backdrop-blur-xl sm:w-[340px]">
        <div className="mb-2 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
        <div className="space-y-2 rounded-lg bg-bg p-3">
          <div className="h-2 w-2/3 rounded bg-gradient-to-r from-blue-electric to-blue-neon opacity-80" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-md border border-border-soft bg-surface" />
            ))}
          </div>
          <div className="flex h-16 items-end gap-1.5 rounded-md border border-border-soft bg-surface p-2">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-blue-main to-blue-neon"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* "Celular" flutuante com agendamento */}
      <div className="animate-float absolute -right-2 bottom-2 z-20 w-28 rounded-2xl border border-border-soft bg-surface-elevated/95 p-2.5 shadow-glow-violet backdrop-blur-xl sm:right-6 sm:w-32">
        <div className="mb-2 h-1.5 w-8 rounded-full bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-1.5 w-3/4 rounded bg-violet-neon/70" />
          <div className="rounded-md border border-border-soft bg-bg p-1.5">
            <div className="h-1 w-full rounded bg-white/10" />
            <div className="mt-1 h-1 w-2/3 rounded bg-white/10" />
          </div>
          <div className="rounded-md bg-gradient-to-r from-blue-main to-blue-neon p-1.5 text-center text-[8px] font-semibold text-white">
            Confirmado
          </div>
        </div>
      </div>

      {/* card flutuante de notificação */}
      <div className="animate-float absolute -left-2 top-6 z-20 w-32 rounded-xl border border-border-soft bg-surface-elevated/95 px-3 py-2 shadow-card backdrop-blur-xl [animation-delay:1.2s] sm:left-2">
        <p className="text-[10px] text-ink-muted">Novo agendamento</p>
        <p className="text-xs font-semibold text-blue-neon">09:00 · Corte Moderno</p>
      </div>
    </div>
  );
}
