'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HeroEnvironmentProps {
  scrollProgress: number;
  isMobile?: boolean;
}

export function HeroEnvironment({ scrollProgress, isMobile = false }: HeroEnvironmentProps) {
  const envGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const floatingHaloRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate ambient dust motes floating gently around the dais using a pure deterministic generator
  const particleData = useMemo(() => {
    const count = isMobile ? 24 : 48;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    // Pure deterministic pseudo-random generator
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < count; i++) {
      const r1 = pseudoRandom(i * 5 + 1);
      const r2 = pseudoRandom(i * 5 + 2);
      const r3 = pseudoRandom(i * 5 + 3);
      const r4 = pseudoRandom(i * 5 + 4);

      // Cylinder distribution around character
      const radius = 1.0 + r1 * 2.8;
      const angle = r2 * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -1.2 + r3 * 3.4;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 0.5;

      speeds[i] = 0.3 + r4 * 0.7;
      offsets[i] = r1 * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry, count, speeds, offsets };
  }, [isMobile]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Orbital Ring kinetic rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.18;
      ring1Ref.current.rotation.x = Math.PI * 0.5 + Math.sin(time * 0.4) * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.24;
      ring2Ref.current.rotation.y = Math.cos(time * 0.3) * 0.12;
    }

    // 2. Floating architectural halo backdrop
    if (floatingHaloRef.current) {
      floatingHaloRef.current.position.y = 0.5 + Math.sin(time * 0.8) * 0.08;
      floatingHaloRef.current.rotation.z = time * 0.05;
    }

    // 3. Gentle vertical drifting of ambient particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleData.count; i++) {
        const yIndex = i * 3 + 1;
        posArray[yIndex] += Math.sin(time * particleData.speeds[i] + particleData.offsets[i]) * 0.003;
        if (posArray[yIndex] > 2.8) posArray[yIndex] = -1.4;
        if (posArray[yIndex] < -1.4) posArray[yIndex] = 2.8;
      }
      posAttr.needsUpdate = true;
    }

    // 4. Scroll Choreography: fades out cleanly as user scrolls into Scene 2
    if (envGroupRef.current) {
      if (scrollProgress < 0.25) {
        envGroupRef.current.visible = true;
        const opacity = Math.max(0, 1 - scrollProgress / 0.2);
        envGroupRef.current.position.y = (isMobile ? 1.75 : -0.25) - scrollProgress * 2.5;
        const baseScale = isMobile ? 0.65 : 1.0;
        envGroupRef.current.scale.set(baseScale * opacity, baseScale * opacity, baseScale * opacity);
      } else {
        envGroupRef.current.visible = false;
      }
    }
  });

  const posX = isMobile ? 0 : 2.2;
  const posY = isMobile ? 1.75 : -0.25;

  return (
    <group ref={envGroupRef} position={[posX, posY, 0]}>
      {/* 1. Concentric Kinetic Orbital Rings around Dais */}
      <group position={[0, -1.25, 0]}>
        {/* Primary Orbital Brass / Anodized Lavender Ring */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.75, 0.022, 16, 64]} />
          <meshStandardMaterial
            color="#B9A5F6"
            metalness={0.85}
            roughness={0.2}
            emissive="#8271B5"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Counter-rotating Secondary Slender Ring */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 2 + 0.2, 0.3, 0]}>
          <torusGeometry args={[2.05, 0.014, 16, 64]} />
          <meshStandardMaterial
            color="#E4DFD7"
            metalness={0.9}
            roughness={0.15}
            emissive="#EDE8FC"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* 2. Floating Minimal Architectural Arch / Halo behind character */}
      <group ref={floatingHaloRef} position={[0, 0.6, -1.2]}>
        <mesh>
          <torusGeometry args={[2.2, 0.018, 16, 80, Math.PI * 1.5]} />
          <meshStandardMaterial
            color="#8271B5"
            metalness={0.7}
            roughness={0.3}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Architectural Marker Notch on halo */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.04]} />
          <meshStandardMaterial color="#B9A5F6" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* 3. Ambient Luminous Dust Particles */}
      <points ref={particlesRef} geometry={particleData.geometry}>
        <pointsMaterial
          size={0.045}
          color="#B9A5F6"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
