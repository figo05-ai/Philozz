'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LuxuryCosmos } from './LuxuryCosmos';

interface SceneDirectorProps {
  scrollProgressRef: React.RefObject<number | null>;
  isMobile?: boolean;
  isMotionDisabled?: boolean;
}

export function SceneDirector({
  scrollProgressRef,
  isMobile = false,
  isMotionDisabled = false,
}: SceneDirectorProps) {
  const { camera } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const goldSpotRef = useRef<THREE.PointLight>(null);

  // Target camera vectors for smooth interpolation
  const targetPos = useRef(new THREE.Vector3(0, 0, isMobile ? 5.8 : 5.0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    // If motion is explicitly disabled (e.g. user prefers-reduced-motion)
    if (isMotionDisabled) {
      camera.position.set(0, 0, isMobile ? 5.8 : 5.0);
      camera.lookAt(0, 0, 0);
      return;
    }

    const sp = scrollProgressRef.current ?? 0; // 0.0 to 1.0
    const pointer = state.pointer;

    // Gentle camera drift linked to scroll & pointer
    const camX = isMobile ? pointer.x * 0.15 : pointer.x * 0.35 + Math.sin(sp * Math.PI) * 0.4;
    const camY = isMobile ? -pointer.y * 0.15 : -pointer.y * 0.25 - sp * 1.2;
    const camZ = THREE.MathUtils.lerp(isMobile ? 5.8 : 5.0, isMobile ? 4.8 : 4.2, sp);

    targetPos.current.set(camX, camY, camZ);
    targetLookAt.current.set(pointer.x * 0.1, -sp * 0.8, 0);

    // Warm golden ambient illumination
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(0.8, 1.1, Math.sin(sp * Math.PI));
    }

    if (goldSpotRef.current) {
      goldSpotRef.current.position.set(
        Math.sin(state.clock.getElapsedTime() * 0.4) * 2.5,
        Math.cos(state.clock.getElapsedTime() * 0.3) * 2.0,
        2.0
      );
    }

    // Smooth continuous camera lerp (eliminates any jerky transitions)
    camera.position.lerp(targetPos.current, 0.06);
    currentLookAt.current.lerp(targetLookAt.current, 0.06);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <>
      {/* Luxury Golden Lighting Rig */}
      <ambientLight ref={ambientLightRef} intensity={0.85} color="#FFF8EB" />
      <directionalLight
        ref={dirLightRef}
        position={[5.0, 7.0, 6.0]}
        intensity={2.2}
        color="#FFE8B8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        ref={goldSpotRef}
        position={[2.0, 2.0, 3.0]}
        intensity={1.8}
        color="#C9A45C"
        distance={15}
      />
      <directionalLight
        position={[-4, -3, -2]}
        intensity={0.6}
        color="#8E733B"
      />

      {/* 3D Luxury Cosmos Ambient World */}
      <LuxuryCosmos scrollProgressRef={scrollProgressRef} isMobile={isMobile} />
    </>
  );
}
