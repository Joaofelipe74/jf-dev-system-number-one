'use client';

import { useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FloatingPanel } from '@/components/3d/floating-panel';

interface SceneProps {
  particleCount: number;
}

/**
 * Grupo principal: reage ao ponteiro (mouse OU toque, via Pointer Events
 * nativos do R3F) com um leve "tilt" de perspectiva, e à rolagem da página
 * com uma pequena rotação adicional — sempre com easing suave (lerp),
 * nunca movimento brusco.
 */
function InteractiveGroup({ particleCount }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const scrollProgress = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Progresso do scroll (0 a 1) medido a partir do topo da página.
    if (typeof window !== 'undefined') {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      scrollProgress.current = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    }

    const targetRotationY = pointer.current.x * 0.35 + scrollProgress.current * 0.6;
    const targetRotationX = -pointer.current.y * 0.2 + scrollProgress.current * -0.15;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotationX,
      0.05
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      -scrollProgress.current * 0.6,
      0.05
    );

    state.camera.lookAt(0, 0, 0);
  });

  // onPointerMove funciona tanto para mouse quanto para toque (Pointer Events),
  // então a composição 3D reage naturalmente ao arrastar o dedo em mobile/tablet.
  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    pointer.current = {
      x: (event.pointer?.x ?? 0),
      y: (event.pointer?.y ?? 0),
    };
  }

  return (
    <group ref={groupRef} onPointerMove={handlePointerMove}>
      {/* "Notebook" com dashboard — peça central */}
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
        <FloatingPanel
          position={[0, 0, 0]}
          size={[2.4, 1.5, 0.08]}
          color="#0D1420"
          emissive="#008CFF"
          showUiLines
        />
      </Float>

      {/* "Celular" com agendamento */}
      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.9}>
        <FloatingPanel
          position={[1.7, -0.7, 0.6]}
          rotation={[0, -0.3, 0.05]}
          size={[0.75, 1.35, 0.07]}
          color="#111B2A"
          emissive="#8B5CF6"
          showUiLines
        />
      </Float>

      {/* Cartões flutuantes de estatística */}
      <Float speed={2.2} rotationIntensity={0.25} floatIntensity={1.1}>
        <FloatingPanel
          position={[-1.9, 0.9, 0.4]}
          rotation={[0, 0.25, -0.05]}
          size={[1.0, 0.6, 0.06]}
          color="#111B2A"
          emissive="#00C2FF"
        />
      </Float>
      <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.8}>
        <FloatingPanel
          position={[-1.4, -1.0, 0.9]}
          rotation={[0, 0.15, 0.05]}
          size={[0.85, 0.5, 0.06]}
          color="#0D1420"
          emissive="#00A8FF"
        />
      </Float>

      <Sparkles count={particleCount} scale={[6, 4, 3]} size={2} speed={0.3} color="#00A8FF" opacity={0.5} />
    </group>
  );
}

interface HeroSceneProps {
  /** Reduz drasticamente partículas/efeitos em dispositivos móveis ou fracos. */
  simplified?: boolean;
  /**
   * CORREÇÃO DE PERFORMANCE: quando `false` (a cena saiu da área visível
   * da tela, detectado via `IntersectionObserver` em `hero-3d.tsx`), o
   * loop de renderização do React Three Fiber é pausado inteiramente
   * (`frameloop="never"`) — antes, a cena continuava renderizando a ~60fps
   * e recalculando física/posições mesmo com o usuário tendo rolado a
   * página muito além do hero, gastando CPU/GPU (e bateria em mobile) à
   * toa.
   */
  active?: boolean;
}

export function HeroScene({ simplified = false, active = true }: HeroSceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={simplified ? [1, 1.25] : [1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      gl={{ antialias: !simplified, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={40} color="#00A8FF" />
      <pointLight position={[-4, -2, 3]} intensity={25} color="#8B5CF6" />
      <InteractiveGroup particleCount={simplified ? 20 : 60} />
    </Canvas>
  );
}
