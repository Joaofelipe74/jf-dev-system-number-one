'use client';

import { RoundedBox } from '@react-three/drei';

interface FloatingPanelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color: string;
  emissive?: string;
  /** Se true, desenha pequenas "linhas de interface" na face frontal (sem depender de fontes externas). */
  showUiLines?: boolean;
}

/**
 * Bloco 3D genérico usado para compor o "notebook", o "celular" e os
 * cartões flutuantes do hero — sempre nas cores da JF Dev (azul elétrico
 * como protagonista, roxo apenas como complemento).
 *
 * Propositalmente não usa texto 3D (que exigiria carregar uma fonte
 * externa): as "linhas de interface" são simples planos, mantendo o
 * projeto livre de dependências visuais externas.
 */
export function FloatingPanel({
  position,
  rotation = [0, 0, 0],
  size = [1.6, 1, 0.06],
  color,
  emissive,
  showUiLines = false,
}: FloatingPanelProps) {
  const [w, h, d] = size;

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={size} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          color={color}
          emissive={emissive ?? color}
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.4}
        />
      </RoundedBox>

      {showUiLines && (
        <group position={[0, 0, d / 2 + 0.005]}>
          <mesh position={[-w * 0.2, h * 0.28, 0]}>
            <planeGeometry args={[w * 0.42, h * 0.09]} />
            <meshBasicMaterial color="#F8FAFC" transparent opacity={0.85} />
          </mesh>
          {[0.05, -0.12, -0.29].map((y, i) => (
            <mesh key={i} position={[0, y * h, 0]}>
              <planeGeometry args={[w * 0.72, h * 0.1]} />
              <meshBasicMaterial color="#0A0F18" transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
