'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PortalMeshProps {
  scrollProgress: number;
}

export function PortalMesh({ scrollProgress }: PortalMeshProps) {
  const portalGroupRef = useRef<THREE.Group>(null);
  const outerGearRef = useRef<THREE.Mesh>(null);
  const irisPetalsGroupRef = useRef<THREE.Group>(null);
  const coreApertureRef = useRef<THREE.Mesh>(null);
  const lightShaftsRef = useRef<THREE.Mesh>(null);
  const tunnelRef = useRef<THREE.Mesh>(null);
  const floatingGlyphsGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Subtle continuous idle rotation
    if (outerGearRef.current) {
      outerGearRef.current.rotation.z = time * 0.15;
    }
    if (irisPetalsGroupRef.current) {
      irisPetalsGroupRef.current.rotation.z = -time * 0.22;
    }
    if (floatingGlyphsGroupRef.current) {
      floatingGlyphsGroupRef.current.rotation.z = time * 0.08;
    }

    if (portalGroupRef.current) {
      // Scene 2 active window: scrollProgress 0.08 to 0.27
      if (scrollProgress >= 0.08 && scrollProgress <= 0.27) {
        portalGroupRef.current.visible = true;

        // Transition progress 0 to 1
        const t = Math.max(0, Math.min(1, (scrollProgress - 0.08) / 0.17));
        const smoothT = t * t * (3 - 2 * t);

        // Dilate portal iris aperture
        if (irisPetalsGroupRef.current) {
          // Petals dilate outward
          const irisOpening = THREE.MathUtils.lerp(0.8, 3.4, smoothT);
          irisPetalsGroupRef.current.scale.set(irisOpening, irisOpening, 1);
        }

        // Entire portal expands from background to engulf camera
        const overallScale = THREE.MathUtils.lerp(0.5, 9.2, smoothT);
        portalGroupRef.current.scale.set(overallScale, overallScale, overallScale);

        // Z-flight: starts deep at z=-8 and glides past camera to z=4.5
        const posZ = THREE.MathUtils.lerp(-9, 4.5, smoothT);
        const posY = THREE.MathUtils.lerp(-0.3, 0.1, smoothT);
        portalGroupRef.current.position.z = posZ;
        portalGroupRef.current.position.y = posY;

        // Shaft of light intensity peaks during transition
        if (lightShaftsRef.current) {
          const mat = lightShaftsRef.current.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.opacity = Math.sin(smoothT * Math.PI) * 0.75;
          }
        }
      } else {
        portalGroupRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={portalGroupRef} position={[0, -0.3, -9]} visible={false}>
      {/* 1. Heavy Monolithic Outer Ring */}
      <mesh ref={outerGearRef}>
        <torusGeometry args={[2.8, 0.18, 32, 64]} />
        <meshStandardMaterial
          color="#1A1A24"
          roughness={0.25}
          metalness={0.8}
          emissive="#6B5B95"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. Concentric Neon Lavender Conduit Ring */}
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[2.4, 0.06, 24, 48]} />
        <meshStandardMaterial
          color="#B9A5F6"
          roughness={0.1}
          metalness={0.9}
          emissive="#D4C8FA"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* 3. Kinetic Iris Diaphragm Aperture (8 Mechanical Blade Segments) */}
      <group ref={irisPetalsGroupRef}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * Math.PI * 2) / 8;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh position={[1.4, 0, 0]}>
                <boxGeometry args={[1.2, 0.35, 0.04]} />
                <meshStandardMaterial
                  color="#262632"
                  roughness={0.3}
                  metalness={0.7}
                  emissive="#8271B5"
                  emissiveIntensity={0.35}
                />
              </mesh>
              {/* Petal neon edge stripe */}
              <mesh position={[0.9, 0.17, 0.025]}>
                <boxGeometry args={[0.9, 0.03, 0.02]} />
                <meshStandardMaterial color="#B9A5F6" emissive="#B9A5F6" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 4. Core Glowing Aperture Lip */}
      <mesh ref={coreApertureRef} position={[0, 0, -0.1]}>
        <torusGeometry args={[1.35, 0.07, 24, 48]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#EDE8FC"
          emissiveIntensity={2.0}
          roughness={0.05}
        />
      </mesh>

      {/* 5. Volumetric Light Funnel / Shaft */}
      <mesh ref={lightShaftsRef} position={[0, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.3, 2.8, 4.2, 36, 1, true]} />
        <meshBasicMaterial
          color="#B9A5F6"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Deep Systems Void Tunnel */}
      <mesh ref={tunnelRef} position={[0, 0, -4.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.28, 3.6, 9.0, 36, 1, true]} />
        <meshStandardMaterial
          color="#101015"
          roughness={0.8}
          metalness={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 7. Floating Architectural Marker Glyphs */}
      <group ref={floatingGlyphsGroupRef} position={[0, 0, 0.2]}>
        {[0, 1, 2, 3].map((idx) => {
          const a = (idx * Math.PI) / 2;
          return (
            <mesh key={idx} position={[Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0]}>
              <boxGeometry args={[0.08, 0.28, 0.05]} />
              <meshStandardMaterial color="#FFA07A" emissive="#FFA07A" emissiveIntensity={1.2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
