'use client';

import { HeroSceneFallback } from '@/components/3d/hero-scene-fallback';

/**
 * Usa a composição animada em CSS enquanto o React Three Fiber 8 não é
 * compatível com o runtime do Next.js 15. Isso evita o erro
 * `ReactCurrentOwner` sem remover o visual 3D da apresentação.
 */
export function Hero3D() {
  return <HeroSceneFallback />;
}
