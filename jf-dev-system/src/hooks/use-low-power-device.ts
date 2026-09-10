'use client';

import { useEffect, useState } from 'react';

/**
 * Heurística simples para detectar dispositivos com pouca capacidade
 * gráfica/CPU (poucos núcleos ou pouca memória reportada) — usada para
 * decidir automaticamente entre a cena 3D completa e a versão simplificada
 * (CSS/SVG), preservando a identidade visual sem comprometer a performance.
 */
export function useLowPowerDevice(): boolean {
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    setIsLowPower(cores <= 4 || memory <= 4);
  }, []);

  return isLowPower;
}
