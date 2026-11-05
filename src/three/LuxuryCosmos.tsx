'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LuxuryCosmosProps {
  scrollProgressRef: React.RefObject<number | null>;
  isMobile?: boolean;
}

export function LuxuryCosmos({ scrollProgressRef, isMobile = false }: LuxuryCosmosProps) {
  const cosmosGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const coreHaloRef = useRef<THREE.Mesh>(null);

  // Generate subtle golden stardust particles
  const particleData = useMemo(() => {
    const count = isMobile ? 40 : 80;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < count; i++) {
      const r1 = pseudoRandom(i * 4 + 1);
      const r2 = pseudoRandom(i * 4 + 2);
      const r3 = pseudoRandom(i * 4 + 3);
      const r4 = pseudoRandom(i * 4 + 4);

      // Spherical distribution around central camera axis
      const theta = r1 * Math.PI * 2;
      const phi = Math.acos(2 * r2 - 1);
      const radius = 3.0 + r3 * 6.0;

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (radius * Math.sin(phi) * Math.sin(theta)) * 0.7;
      positions[i * 3 + 2] = radius * Math.cos(phi) - 2.5;

      speeds[i] = 0.15 + r4 * 0.4;
      offsets[i] = r1 * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry, count, speeds, offsets };
  }, [isMobile]);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current ?? 0;

    // Strict Scope Rule & Performance Optimization:
    // Gold orbital rings are active EXCLUSIVELY in the Technology/Skills cosmos region (~0.20 to ~0.50).
    // They emerge smoothly as visitor enters Skills, and fade out completely BEFORE Projects (> 0.52)
    // so they NEVER leak into Featured Projects or Engineering Journal.
    // Beyond 0.55, suspend mesh updates and buffer uploads completely.
    if (scrollProgress >= 0.55) {
      if (ring1Ref.current && ring1Ref.current.visible) ring1Ref.current.visible = false;
      if (ring2Ref.current && ring2Ref.current.visible) ring2Ref.current.visible = false;
      if (ring3Ref.current && ring3Ref.current.visible) ring3Ref.current.visible = false;
      if (coreHaloRef.current && coreHaloRef.current.visible) coreHaloRef.current.visible = false;
      if (particlesRef.current && particlesRef.current.visible) particlesRef.current.visible = false;
      return;
    }

    if (particlesRef.current && !particlesRef.current.visible) {
      particlesRef.current.visible = true;
    }

    const time = state.clock.getElapsedTime();
    const pointer = state.pointer;

    const fadeIn = THREE.MathUtils.smoothstep(scrollProgress, 0.20, 0.32);
    const fadeOut = 1.0 - THREE.MathUtils.smoothstep(scrollProgress, 0.46, 0.53);
    const ringsActive = fadeIn * fadeOut;
    const ringScale = THREE.MathUtils.lerp(0.001, 1.0, ringsActive);
    const isVisible = ringsActive > 0.01;

    // 1. Kinetic Luxury Gold Rings Rotation & Pointer Reactivity
    if (ring1Ref.current) {
      ring1Ref.current.scale.setScalar(ringScale);
      ring1Ref.current.visible = isVisible;
      ring1Ref.current.rotation.z = time * 0.08 + scrollProgress * Math.PI * 0.5;
      ring1Ref.current.rotation.x = Math.PI * 0.35 + Math.sin(time * 0.3) * 0.06 + pointer.y * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.scale.setScalar(ringScale);
      ring2Ref.current.visible = isVisible;
      ring2Ref.current.rotation.z = -time * 0.12 - scrollProgress * Math.PI * 0.4;
      ring2Ref.current.rotation.y = Math.PI * 0.25 + Math.cos(time * 0.25) * 0.08 + pointer.x * 0.1;
    }
    if (ring3Ref.current) {
      ring3Ref.current.scale.setScalar(ringScale);
      ring3Ref.current.visible = isVisible;
      ring3Ref.current.rotation.x = time * 0.06;
      ring3Ref.current.rotation.y = -time * 0.09;
    }

    // 2. Halo Ambient Breathing
    if (coreHaloRef.current) {
      coreHaloRef.current.scale.setScalar(ringScale);
      coreHaloRef.current.visible = isVisible;
      coreHaloRef.current.rotation.z = time * 0.04;
    }

    // 3. Subtle Gold Stardust Drifting (restrained opacity in Hero)
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleData.count; i++) {
        const yIndex = i * 3 + 1;
        posArray[yIndex] += Math.sin(time * particleData.speeds[i] + particleData.offsets[i]) * 0.0015;
        if (posArray[yIndex] > 6.0) posArray[yIndex] = -4.0;
        if (posArray[yIndex] < -4.0) posArray[yIndex] = 6.0;
      }
      posAttr.needsUpdate = true;
    }

    // 4. Parallax scroll shift
    if (cosmosGroupRef.current) {
      cosmosGroupRef.current.position.y = -scrollProgress * 2.5;
    }
  });

  const posX = isMobile ? 0 : 0.8;
  const posY = isMobile ? 0.5 : -0.2;

  return (
    <group ref={cosmosGroupRef} position={[posX, posY, -1.5]}>
      {/* 1. Large Champagne Gold Kinetic Armillary Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[isMobile ? 2.2 : 3.4, 0.024, 24, 96]} />
        <meshStandardMaterial
          color="#C9A45C"
          roughness={0.18}
          metalness={0.92}
          emissive="#7D6025"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. Concentric Gold Inclined Orbital Track */}
      <mesh ref={ring2Ref} position={[0, 0, 0.1]}>
        <torusGeometry args={[isMobile ? 1.8 : 2.8, 0.016, 20, 80]} />
        <meshStandardMaterial
          color="#E4C88A"
          roughness={0.12}
          metalness={0.95}
          emissive="#C9A45C"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 3. Deep Architectural Gyroscope Ring */}
      <mesh ref={ring3Ref} position={[0, 0, -0.2]}>
        <torusGeometry args={[isMobile ? 2.6 : 4.0, 0.012, 16, 64]} />
        <meshStandardMaterial
          color="#8E733B"
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>

      {/* 4. Ambient Golden Stardust Cloud */}
      <points ref={particlesRef} geometry={particleData.geometry}>
        <pointsMaterial
          size={isMobile ? 0.03 : 0.045}
          color="#E4C88A"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 5. Soft Luminous Center Halo Disc */}
      <mesh ref={coreHaloRef} position={[0, 0, -1.5]}>
        <ringGeometry args={[0.8, isMobile ? 2.5 : 3.8, 48]} />
        <meshBasicMaterial
          color="#C9A45C"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
