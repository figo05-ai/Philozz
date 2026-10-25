'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CharacterMeshProps {
  scrollProgress: number; // 0 to 1 across the full page
  isMobile?: boolean;
}

export function CharacterMesh({ scrollProgress, isMobile = false }: CharacterMeshProps) {
  // References for kinematic joints
  const rootGroupRef = useRef<THREE.Group>(null);
  const characterBodyRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const chestGroupRef = useRef<THREE.Group>(null);
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const heartCoreLightRef = useRef<THREE.PointLight>(null);
  const heartCoreMeshRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  // Animation timing state refs
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const saccadeTimerRef = useRef(0);
  const saccadeOffsetRef = useRef({ x: 0, y: 0 });
  const idleGlanceTimerRef = useRef(0);
  const idleGlanceOffsetRef = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const pointer = state.pointer;

    // Distance of cursor from screen center (for proximity reaction)
    const cursorDist = Math.sqrt(pointer.x * pointer.x + pointer.y * pointer.y);
    const proximity = Math.max(0, 1 - cursorDist * 0.7);

    // 1. Organic Multi-Frequency Breathing & Body Sway
    const torsoBreath = Math.sin(time * 2.2) * 0.03;
    const chestBreath = Math.sin(time * 2.2 + 0.35) * 0.04;
    const subtleSway = Math.cos(time * 1.1) * 0.02;

    if (chestGroupRef.current) {
      chestGroupRef.current.position.y = chestBreath;
      chestGroupRef.current.rotation.x = Math.sin(time * 2.2) * 0.02;
    }

    // 2. Realistic Double/Single Blinking
    blinkTimerRef.current += delta;
    if (blinkTimerRef.current > 3.8 + Math.sin(time * 0.4) * 1.4) {
      isBlinkingRef.current = true;
      if (blinkTimerRef.current > 4.05 + Math.sin(time * 0.4) * 1.4) {
        blinkTimerRef.current = 0;
        isBlinkingRef.current = false;
      }
    }

    // Digital Eye Blinking Morph (Squash & stretch in Y)
    const targetLidScale = isBlinkingRef.current ? 0.08 : 1.0;
    if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
      leftEyeGroupRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeGroupRef.current.scale.y,
        targetLidScale,
        0.45
      );
      rightEyeGroupRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeGroupRef.current.scale.y,
        targetLidScale,
        0.45
      );
    }

    // 3. Saccadic Eye Micro-Movements & Cursor Tracking
    saccadeTimerRef.current += delta;
    if (saccadeTimerRef.current > 1.8) {
      saccadeTimerRef.current = 0;
      saccadeOffsetRef.current = {
        x: (Math.random() - 0.5) * 0.03,
        y: (Math.random() - 0.5) * 0.02,
      };
    }

    // Idle curiosity glance when user is inactive
    idleGlanceTimerRef.current += delta;
    if (idleGlanceTimerRef.current > 6.0) {
      idleGlanceTimerRef.current = 0;
      idleGlanceOffsetRef.current = {
        x: (Math.random() - 0.5) * 0.12,
        y: (Math.random() - 0.5) * 0.08,
      };
    }

    // 4. Head and Neck Gaze Interpolation
    if (headGroupRef.current) {
      const targetHeadX = isMobile
        ? Math.sin(time * 0.7) * 0.08
        : -pointer.y * 0.35 + idleGlanceOffsetRef.current.y * 0.5;
      const targetHeadY = isMobile
        ? Math.cos(time * 0.6) * 0.12
        : pointer.x * 0.45 + idleGlanceOffsetRef.current.x * 0.5;
      const targetHeadZ = isMobile ? 0 : -pointer.x * 0.15;

      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetHeadX, 0.07);
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetHeadY, 0.07);
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, targetHeadZ, 0.07);
    }

    // Eye gaze convergence inside the visor
    const eyeFollowX = isMobile ? Math.sin(time) * 0.015 : pointer.x * 0.045 + saccadeOffsetRef.current.x;
    const eyeFollowY = isMobile ? 0 : pointer.y * 0.035 + saccadeOffsetRef.current.y;

    if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
      leftEyeGroupRef.current.position.x = THREE.MathUtils.lerp(leftEyeGroupRef.current.position.x, -0.24 + eyeFollowX, 0.15);
      leftEyeGroupRef.current.position.y = THREE.MathUtils.lerp(leftEyeGroupRef.current.position.y, 0.04 + eyeFollowY, 0.15);
      rightEyeGroupRef.current.position.x = THREE.MathUtils.lerp(rightEyeGroupRef.current.position.x, 0.24 + eyeFollowX, 0.15);
      rightEyeGroupRef.current.position.y = THREE.MathUtils.lerp(rightEyeGroupRef.current.position.y, 0.04 + eyeFollowY, 0.15);
    }

    // 5. "Backend at Heart" Dynamic Core Reactor Pulse
    const heartWave =
      Math.pow(Math.sin(time * 3.2), 14) * 0.55 +
      Math.pow(Math.sin(time * 3.2 - 0.32), 14) * 0.35 +
      0.35 +
      proximity * 0.3;

    if (heartCoreLightRef.current) {
      heartCoreLightRef.current.intensity = heartWave * 1.6;
    }
    if (heartCoreMeshRef.current) {
      const mat = heartCoreMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = heartWave * 2.2;
      }
    }

    // 6. Natural Arm & Forearm Pose Swaying
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        0.28 + Math.sin(time * 1.4) * 0.03,
        0.08
      );
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        -0.28 - Math.sin(time * 1.4 + 0.5) * 0.03,
        0.08
      );
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftForearmRef.current.rotation.x,
        0.45 + Math.sin(time * 2.0) * 0.04,
        0.08
      );
      rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.x,
        0.45 + Math.sin(time * 2.0 + 0.3) * 0.04,
        0.08
      );
    }

    // 7. Full Scroll Choreography (Scene 1 -> Scene 2 -> ... -> Scene 6)
    if (rootGroupRef.current) {
      const sp = scrollProgress;
      const baseMobileY = 1.45;
      const baseDesktopY = -0.25;

      let targetX = isMobile ? 0 : 2.2;
      let targetY = (isMobile ? baseMobileY : baseDesktopY) + torsoBreath;
      let targetZ = 0;
      let targetRotY = 0;
      let targetRotX = 0;
      let targetScale = isMobile ? 0.65 : 1.05;
      let visible = true;

      if (sp < 0.10) {
        // Scene 1: Arrival Hero (Framed in top 35% on mobile, right 45% on desktop)
        targetX = isMobile ? 0 : 2.2;
        targetY = (isMobile ? baseMobileY : baseDesktopY) + torsoBreath;
        targetZ = 0;
        targetRotY = isMobile ? 0 : -0.2;
        targetScale = isMobile ? 0.65 : 1.05;
      } else if (sp >= 0.10 && sp < 0.25) {
        // Scene 2 Transformation: Philo leans forward, rotates into the portal aperture, retreats with depth
        const t = (sp - 0.10) / 0.15; // 0 to 1
        const easedT = t * t * (3 - 2 * t);

        targetX = THREE.MathUtils.lerp(isMobile ? 0 : 2.2, 0, easedT);
        targetY = THREE.MathUtils.lerp(isMobile ? baseMobileY : baseDesktopY, -0.6, easedT);
        targetZ = THREE.MathUtils.lerp(0, -9.5, easedT);
        targetRotX = THREE.MathUtils.lerp(0, 0.3, easedT); // Leans forward
        targetRotY = THREE.MathUtils.lerp(isMobile ? 0 : -0.2, Math.PI * 0.15, easedT);
        targetScale = THREE.MathUtils.lerp(isMobile ? 0.65 : 1.05, 0.32, easedT);
      } else if (sp >= 0.25 && sp < 0.92) {
        // Deep background / hidden during architectural systems & projects
        targetZ = -35;
        targetScale = 0.001;
        visible = false;
      } else {
        // Scene 6 Finale Return: Re-enters gracefully as a warm closing companion
        if (rootGroupRef.current.position.z < -12) {
          rootGroupRef.current.position.z = -7;
        }
        const t = Math.min(1, Math.max(0, (sp - 0.92) / 0.08));
        const easedT = t * t * (3 - 2 * t);

        targetX = isMobile ? 0 : 2.0;
        targetY = (isMobile ? 1.45 : -0.25) + torsoBreath;
        targetZ = THREE.MathUtils.lerp(-7, 0, easedT);
        targetRotY = THREE.MathUtils.lerp(Math.PI * 0.2, -0.15, easedT);
        targetScale = (isMobile ? 0.65 : 1.05) * Math.max(0.1, easedT);
        visible = true;
      }

      rootGroupRef.current.position.x = THREE.MathUtils.lerp(rootGroupRef.current.position.x, targetX, 0.08);
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, targetY, 0.08);
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, targetZ, 0.08);
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(rootGroupRef.current.rotation.y, targetRotY, 0.08);
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(rootGroupRef.current.rotation.x, targetRotX, 0.08);
      rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(rootGroupRef.current.rotation.z, subtleSway, 0.08);

      const curScale = THREE.MathUtils.lerp(rootGroupRef.current.scale.x, targetScale, 0.08);
      rootGroupRef.current.scale.set(curScale, curScale, curScale);
      rootGroupRef.current.visible = visible;
    }
  });

  // Sophisticated Material Palette
  const porcelainColor = '#EDE9E3';
  const porcelainRoughness = 0.24;
  const porcelainMetalness = 0.06;

  const cowlPlumColor = '#5B4E7A';
  const cowlRoughness = 0.32;
  const cowlMetalness = 0.18;

  const lavenderMetalColor = '#8F7CC4';
  const lavenderRoughness = 0.22;
  const lavenderMetalness = 0.85;

  const darkObsidianColor = '#12121A';
  const darkObsidianRoughness = 0.08;
  const darkObsidianMetalness = 0.75;

  const plinthBaseColor = '#E3DFD4';
  const plinthAccentColor = '#24242E';

  const defaultX = isMobile ? 0 : 2.2;
  const defaultY = isMobile ? 1.45 : -0.25;

  return (
    <group ref={rootGroupRef} position={[defaultX, defaultY, 0]}>
      {/* ========================================================
          1. MULTI-TIERED ARCHITECTURAL PEDESTAL & DAIS
          ======================================================== */}
      <group position={[0, -1.35, 0]}>
        {/* Upper Ivory Fluted Pedestal */}
        <mesh receiveShadow castShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[1.18, 1.25, 0.22, 54]} />
          <meshStandardMaterial
            color={porcelainColor}
            roughness={porcelainRoughness}
            metalness={porcelainMetalness}
          />
        </mesh>

        {/* Concentric Beveled Inset Ring on Pedestal Surface */}
        <mesh position={[0, 0.295, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1.1, 48]} />
          <meshStandardMaterial
            color="#DFD9CD"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>

        {/* Recessed Dark Architectural Shadow Channel */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[1.08, 1.08, 0.08, 48]} />
          <meshStandardMaterial color={plinthAccentColor} roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Lower Stepped Stone Dais */}
        <mesh receiveShadow castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[1.42, 1.52, 0.24, 54]} />
          <meshStandardMaterial
            color={plinthBaseColor}
            roughness={0.45}
            metalness={0.04}
          />
        </mesh>

        {/* Soft Radial Ambient Occlusion Shadow Disc */}
        <mesh position={[0, -0.245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 2.1, 36]} />
          <meshBasicMaterial color="#0A0A0E" transparent opacity={0.28} />
        </mesh>
      </group>

      {/* ========================================================
          2. PHILO CHARACTER MAIN KINEMATIC BODY
          ======================================================== */}
      <group ref={characterBodyRef} position={[0, -0.1, 0]}>
        {/* Floating Pod Chassis Base / Pelvis */}
        <mesh castShadow receiveShadow position={[0, -0.52, 0]}>
          <cylinderGeometry args={[0.55, 0.72, 0.42, 36]} />
          <meshStandardMaterial
            color={porcelainColor}
            roughness={porcelainRoughness}
            metalness={porcelainMetalness}
          />
        </mesh>

        {/* Chassis Lower Accent Trim Ring */}
        <mesh position={[0, -0.72, 0]}>
          <torusGeometry args={[0.68, 0.045, 16, 40]} />
          <meshStandardMaterial
            color={lavenderMetalColor}
            roughness={lavenderRoughness}
            metalness={lavenderMetalness}
          />
        </mesh>

        {/* ========================================================
            3. CHEST & "BACKEND AT HEART" REACTOR CORE
            ======================================================== */}
        <group ref={chestGroupRef} position={[0, 0, 0]}>
          {/* Main Sculpted Porcelain Torso Carapace */}
          <mesh castShadow receiveShadow position={[0, -0.05, 0]}>
            <sphereGeometry args={[0.82, 40, 40]} />
            <meshStandardMaterial
              color={porcelainColor}
              roughness={porcelainRoughness}
              metalness={porcelainMetalness}
            />
          </mesh>

          {/* Ergonomic Upper Chest Armor Plate */}
          <mesh castShadow receiveShadow position={[0, 0.12, 0.22]}>
            <boxGeometry args={[0.96, 0.62, 0.48]} />
            <meshStandardMaterial
              color={porcelainColor}
              roughness={0.28}
              metalness={0.05}
            />
          </mesh>

          {/* "Backend at Heart" Reactor Housing Aperture */}
          <group position={[0, 0.08, 0.52]}>
            {/* Outer Inset Dark Bezel */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.06, 32]} />
              <meshStandardMaterial color={darkObsidianColor} roughness={0.15} metalness={0.7} />
            </mesh>

            {/* Anodized Lavender Accent Retaining Ring */}
            <mesh position={[0, 0, 0.02]}>
              <torusGeometry args={[0.22, 0.025, 16, 32]} />
              <meshStandardMaterial
                color={lavenderMetalColor}
                roughness={lavenderRoughness}
                metalness={lavenderMetalness}
              />
            </mesh>

            {/* Pulsing Luminous Heart Reactor Core Mesh */}
            <mesh ref={heartCoreMeshRef} position={[0, 0, 0.015]}>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial
                color="#FFA07A"
                emissive="#FF6E4A"
                emissiveIntensity={1.8}
                roughness={0.15}
              />
            </mesh>

            {/* Inner Concentric Filament Disc */}
            <mesh position={[0, 0, 0.03]}>
              <ringGeometry args={[0.07, 0.14, 24]} />
              <meshBasicMaterial color="#EDE8FC" transparent opacity={0.8} />
            </mesh>

            {/* Dedicated Local Point Light from the Heart */}
            <pointLight
              ref={heartCoreLightRef}
              position={[0, 0, 0.2]}
              color="#FFA07A"
              intensity={1.5}
              distance={3.0}
            />
          </group>

          {/* Sleek Backend Energy Pack on Back */}
          <group position={[0, 0.1, -0.5]}>
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.62, 0.72, 0.28]} />
              <meshStandardMaterial color={cowlPlumColor} roughness={cowlRoughness} metalness={cowlMetalness} />
            </mesh>
            {/* Heat Dissipation Ribs */}
            {[-0.18, 0, 0.18].map((yOffset, idx) => (
              <mesh key={idx} position={[0, yOffset, -0.15]}>
                <boxGeometry args={[0.48, 0.04, 0.04]} />
                <meshStandardMaterial color={lavenderMetalColor} metalness={0.9} roughness={0.1} />
              </mesh>
            ))}
          </group>

          {/* ========================================================
              4. ARTICULATED SHOULDERS & EXPRESSIVE ARMS
              ======================================================== */}
          {/* Left Arm Assembly */}
          <group ref={leftArmRef} position={[-0.88, 0.15, 0]}>
            {/* Shoulder Ball Joint */}
            <mesh castShadow>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial color={cowlPlumColor} roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[-0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.22, 0.03, 16, 24]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Upper Arm Bicep */}
            <mesh castShadow position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.15, 0.35, 16, 16]} />
              <meshStandardMaterial color={porcelainColor} roughness={porcelainRoughness} metalness={porcelainMetalness} />
            </mesh>

            {/* Left Forearm & Hand */}
            <group ref={leftForearmRef} position={[0, -0.58, 0]}>
              <mesh castShadow position={[0, -0.22, 0.08]}>
                <capsuleGeometry args={[0.14, 0.38, 16, 16]} />
                <meshStandardMaterial color={porcelainColor} roughness={porcelainRoughness} metalness={porcelainMetalness} />
              </mesh>

              {/* Forearm Accent Cuff Ring */}
              <mesh position={[0, -0.36, 0.08]}>
                <torusGeometry args={[0.15, 0.024, 16, 24]} />
                <meshStandardMaterial color={lavenderMetalColor} metalness={0.85} roughness={0.2} />
              </mesh>

              {/* Expressive Sculpted Hand */}
              <group position={[0, -0.48, 0.12]} rotation={[0.2, 0.1, -0.1]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.13, 18, 18]} />
                  <meshStandardMaterial color={porcelainColor} roughness={0.25} />
                </mesh>
                <mesh position={[0, -0.1, 0.04]} rotation={[0.4, 0, 0]}>
                  <capsuleGeometry args={[0.07, 0.14, 12, 12]} />
                  <meshStandardMaterial color={porcelainColor} roughness={0.25} />
                </mesh>
              </group>
            </group>
          </group>

          {/* Right Arm Assembly */}
          <group ref={rightArmRef} position={[0.88, 0.15, 0]}>
            {/* Shoulder Ball Joint */}
            <mesh castShadow>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial color={cowlPlumColor} roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.22, 0.03, 16, 24]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Upper Arm Bicep */}
            <mesh castShadow position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.15, 0.35, 16, 16]} />
              <meshStandardMaterial color={porcelainColor} roughness={porcelainRoughness} metalness={porcelainMetalness} />
            </mesh>

            {/* Right Forearm & Hand */}
            <group ref={rightForearmRef} position={[0, -0.58, 0]}>
              <mesh castShadow position={[0, -0.22, 0.08]}>
                <capsuleGeometry args={[0.14, 0.38, 16, 16]} />
                <meshStandardMaterial color={porcelainColor} roughness={porcelainRoughness} metalness={porcelainMetalness} />
              </mesh>

              {/* Forearm Accent Cuff Ring */}
              <mesh position={[0, -0.36, 0.08]}>
                <torusGeometry args={[0.15, 0.024, 16, 24]} />
                <meshStandardMaterial color={lavenderMetalColor} metalness={0.85} roughness={0.2} />
              </mesh>

              {/* Expressive Sculpted Hand */}
              <group position={[0, -0.48, 0.12]} rotation={[0.2, -0.1, 0.1]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.13, 18, 18]} />
                  <meshStandardMaterial color={porcelainColor} roughness={0.25} />
                </mesh>
                <mesh position={[0, -0.1, 0.04]} rotation={[0.4, 0, 0]}>
                  <capsuleGeometry args={[0.07, 0.14, 12, 12]} />
                  <meshStandardMaterial color={porcelainColor} roughness={0.25} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* ========================================================
            5. GIMBAL NECK & SCULPTED ARTISTIC HEAD
            ======================================================== */}
        {/* Gimbal Collar Assembly */}
        <group position={[0, 0.62, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.16, 32]} />
            <meshStandardMaterial color={darkObsidianColor} roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.03, 16, 32]} />
            <meshStandardMaterial color={lavenderMetalColor} metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* Head Kinematic Pivot Group */}
        <group ref={headGroupRef} position={[0, 1.08, 0.05]}>
          {/* Main Sculpted Cranium Helmet Base */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.76, 40, 40]} />
            <meshStandardMaterial
              color={porcelainColor}
              roughness={porcelainRoughness}
              metalness={porcelainMetalness}
            />
          </mesh>

          {/* Swept Streamlined Architectural Head Crest / Cowl */}
          <group position={[0, 0.52, -0.12]} rotation={[0.22, 0, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.48, 0.16, 24, 48, Math.PI * 1.35]} />
              <meshStandardMaterial
                color={cowlPlumColor}
                roughness={cowlRoughness}
                metalness={cowlMetalness}
              />
            </mesh>
            <mesh position={[0.45, 0.32, 0.08]} castShadow>
              <capsuleGeometry args={[0.11, 0.32, 16, 16]} />
              <meshStandardMaterial
                color={lavenderMetalColor}
                roughness={0.25}
                metalness={0.85}
              />
            </mesh>
          </group>

          {/* Temple Audio Pod Transducers / Ear Dials */}
          {/* Left Ear Pod */}
          <group position={[-0.74, 0.08, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.24, 0.12, 32]} />
              <meshStandardMaterial color={cowlPlumColor} roughness={0.25} metalness={0.4} />
            </mesh>
            <mesh position={[-0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.18, 0.025, 16, 32]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[-0.08, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#B9A5F6" />
            </mesh>
          </group>

          {/* Right Ear Pod */}
          <group position={[0.74, 0.08, 0]}>
            <mesh castShadow rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.24, 0.12, 32]} />
              <meshStandardMaterial color={cowlPlumColor} roughness={0.25} metalness={0.4} />
            </mesh>
            <mesh position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.18, 0.025, 16, 32]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0.08, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#B9A5F6" />
            </mesh>
          </group>

          {/* Prominent Ergonomic Curved Obsidian Visor Mask */}
          <group position={[0, 0.04, 0.36]}>
            {/* Curved wrap-around helmet visor screen */}
            <mesh receiveShadow position={[0, 0, 0.08]}>
              <cylinderGeometry args={[0.58, 0.58, 0.42, 36, 1, false, -Math.PI * 0.46, Math.PI * 0.92]} />
              <meshStandardMaterial
                color={darkObsidianColor}
                roughness={darkObsidianRoughness}
                metalness={darkObsidianMetalness}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Sculpted Curved Lavender Brow Bezel */}
            <mesh position={[0, 0.22, 0.08]} rotation={[Math.PI / 2, 0, -Math.PI * 0.46]}>
              <torusGeometry args={[0.585, 0.024, 16, 36, Math.PI * 0.92]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Sculpted Curved Lower Chin Bezel */}
            <mesh position={[0, -0.21, 0.08]} rotation={[Math.PI / 2, 0, -Math.PI * 0.46]}>
              <torusGeometry args={[0.585, 0.02, 16, 36, Math.PI * 0.92]} />
              <meshStandardMaterial color={lavenderMetalColor} metalness={0.9} roughness={0.15} />
            </mesh>

            {/* ========================================================
                6. EXPRESSIVE LUMINOUS DIGITAL CYCLOPS/DUAL RETICLE EYES
                ======================================================== */}
            {/* Left Glowing Digital Eye */}
            <group ref={leftEyeGroupRef} position={[-0.22, 0.02, 0.58]}>
              {/* Outer Radiant Glow Disc */}
              <mesh>
                <circleGeometry args={[0.12, 24]} />
                <meshBasicMaterial color="#52D1FF" transparent opacity={0.45} />
              </mesh>

              {/* Core Luminous Digital Eye Pill */}
              <mesh position={[0, 0, 0.01]}>
                <capsuleGeometry args={[0.075, 0.11, 16, 16]} />
                <meshStandardMaterial
                  color="#F0FAFF"
                  emissive="#52D1FF"
                  emissiveIntensity={3.4}
                  roughness={0.05}
                />
              </mesh>

              {/* Specular Catchlight Sparkle */}
              <mesh position={[0.025, 0.035, 0.08]}>
                <sphereGeometry args={[0.024, 12, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>

            {/* Right Glowing Digital Eye */}
            <group ref={rightEyeGroupRef} position={[0.22, 0.02, 0.58]}>
              {/* Outer Radiant Glow Disc */}
              <mesh>
                <circleGeometry args={[0.12, 24]} />
                <meshBasicMaterial color="#52D1FF" transparent opacity={0.45} />
              </mesh>

              {/* Core Luminous Digital Eye Pill */}
              <mesh position={[0, 0, 0.01]}>
                <capsuleGeometry args={[0.075, 0.11, 16, 16]} />
                <meshStandardMaterial
                  color="#F0FAFF"
                  emissive="#52D1FF"
                  emissiveIntensity={3.4}
                  roughness={0.05}
                />
              </mesh>

              {/* Specular Catchlight Sparkle */}
              <mesh position={[0.025, 0.035, 0.08]}>
                <sphereGeometry args={[0.024, 12, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>

            {/* Subtle Rosy Glow under Eyes */}
            <mesh position={[-0.28, -0.12, 0.56]}>
              <circleGeometry args={[0.07, 16]} />
              <meshBasicMaterial color="#E89284" transparent opacity={0.35} />
            </mesh>
            <mesh position={[0.28, -0.12, 0.56]}>
              <circleGeometry args={[0.07, 16]} />
              <meshBasicMaterial color="#E89284" transparent opacity={0.35} />
            </mesh>

            {/* Expressive Minimal Mouth Slit */}
            <mesh position={[0, -0.13, 0.60]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.012, 0.12, 8, 8]} />
              <meshStandardMaterial color={lavenderMetalColor} roughness={0.3} metalness={0.6} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
