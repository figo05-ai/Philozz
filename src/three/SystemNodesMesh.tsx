'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SystemNodesMeshProps {
  scrollProgress: number;
  isMobile?: boolean;
}

export function SystemNodesMesh({ scrollProgress, isMobile = false }: SystemNodesMeshProps) {
  const systemGroupRef = useRef<THREE.Group>(null);
  const gatewayRef = useRef<THREE.Group>(null);
  const queueGroupRef = useRef<THREE.Group>(null);
  const queueRingRef = useRef<THREE.Mesh>(null);
  const cacheRef = useRef<THREE.Group>(null);
  const dbGroupRef = useRef<THREE.Group>(null);
  const workerGroupRef = useRef<THREE.Group>(null);

  // Signal packet mesh refs
  const signal1Ref = useRef<THREE.Mesh>(null);
  const signal2Ref = useRef<THREE.Mesh>(null);
  const signal3Ref = useRef<THREE.Mesh>(null);
  const signal4Ref = useRef<THREE.Mesh>(null);
  const signal5Ref = useRef<THREE.Mesh>(null);

  // Conduit curves and geometries
  const {
    curveGatewayToQueue,
    curveQueueToWorker,
    curveWorkerToDB,
    curveGatewayToCache,
    curveCacheToDB,
    geomGatewayToQueue,
    geomQueueToWorker,
    geomWorkerToDB,
    geomGatewayToCache,
    geomCacheToDB,
  } = useMemo(() => {
    // 3D coordinates for nodes
    const pGateway = new THREE.Vector3(0, 1.8, 0);
    const pQueue = new THREE.Vector3(-2.2, 0.4, 0.2);
    const pCache = new THREE.Vector3(2.2, 0.6, 0.1);
    const pWorker = new THREE.Vector3(-1.5, -1.4, -0.2);
    const pDB = new THREE.Vector3(1.4, -1.5, -0.3);

    const c1 = new THREE.QuadraticBezierCurve3(pGateway, new THREE.Vector3(-1.3, 1.3, 0.1), pQueue);
    const c2 = new THREE.QuadraticBezierCurve3(pQueue, new THREE.Vector3(-2.4, -0.5, 0.0), pWorker);
    const c3 = new THREE.QuadraticBezierCurve3(pWorker, new THREE.Vector3(0.0, -2.0, -0.4), pDB);
    const c4 = new THREE.QuadraticBezierCurve3(pGateway, new THREE.Vector3(1.4, 1.4, 0.2), pCache);
    const c5 = new THREE.QuadraticBezierCurve3(pCache, new THREE.Vector3(2.3, -0.4, 0.0), pDB);

    const makeTube = (curve: THREE.QuadraticBezierCurve3) =>
      new THREE.TubeGeometry(curve, 32, 0.038, 10, false);

    return {
      curveGatewayToQueue: c1,
      curveQueueToWorker: c2,
      curveWorkerToDB: c3,
      curveGatewayToCache: c4,
      curveCacheToDB: c5,
      geomGatewayToQueue: makeTube(c1),
      geomQueueToWorker: makeTube(c2),
      geomWorkerToDB: makeTube(c3),
      geomGatewayToCache: makeTube(c4),
      geomCacheToDB: makeTube(c5),
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. API Gateway kinetic idle
    if (gatewayRef.current) {
      gatewayRef.current.rotation.y = time * 0.5;
      gatewayRef.current.rotation.x = Math.sin(time * 0.8) * 0.15;
    }

    // 2. Queue conveyer rotation
    if (queueRingRef.current) {
      queueRingRef.current.rotation.z = time * 0.75;
    }

    // 3. Cache levitation & rotation
    if (cacheRef.current) {
      cacheRef.current.rotation.y = -time * 0.6;
      cacheRef.current.rotation.z = Math.sin(time * 1.2) * 0.1;
      cacheRef.current.position.y = 0.6 + Math.sin(time * 1.6) * 0.08;
    }

    // 4. Database platters rotation
    if (dbGroupRef.current) {
      dbGroupRef.current.rotation.y = time * 0.25;
    }

    // 5. Worker cluster turbine
    if (workerGroupRef.current) {
      workerGroupRef.current.rotation.y = time * 1.4;
    }

    // 6. True Bezier Curve sampling for glowing data signals (Smooth flow along conduits!)
    const t1 = (time * 0.7) % 1;
    const t2 = (time * 0.85 + 0.3) % 1;
    const t3 = (time * 0.75 + 0.6) % 1;
    const t4 = (time * 0.8 + 0.15) % 1;
    const t5 = (time * 0.65 + 0.5) % 1;

    if (signal1Ref.current) {
      const pt = curveGatewayToQueue.getPoint(t1);
      signal1Ref.current.position.copy(pt);
    }
    if (signal2Ref.current) {
      const pt = curveQueueToWorker.getPoint(t2);
      signal2Ref.current.position.copy(pt);
    }
    if (signal3Ref.current) {
      const pt = curveWorkerToDB.getPoint(t3);
      signal3Ref.current.position.copy(pt);
    }
    if (signal4Ref.current) {
      const pt = curveGatewayToCache.getPoint(t4);
      signal4Ref.current.position.copy(pt);
    }
    if (signal5Ref.current) {
      const pt = curveCacheToDB.getPoint(t5);
      signal5Ref.current.position.copy(pt);
    }

    // 7. Scroll presence: Scene 3 is active between scrollProgress 0.22 and 0.46
    if (systemGroupRef.current) {
      if (scrollProgress >= 0.22 && scrollProgress <= 0.46) {
        systemGroupRef.current.visible = true;

        const entryT = Math.min(1, Math.max(0, (scrollProgress - 0.22) / 0.05));
        const exitT = Math.min(1, Math.max(0, (0.46 - scrollProgress) / 0.05));
        const smoothVis = entryT * exitT;

        const baseScale = isMobile ? 0.62 : 1.05;
        systemGroupRef.current.scale.set(
          baseScale * smoothVis,
          baseScale * smoothVis,
          baseScale * smoothVis
        );

        systemGroupRef.current.position.y = (scrollProgress - 0.35) * -1.6;
        systemGroupRef.current.position.z = THREE.MathUtils.lerp(-3, 0.2, entryT);
      } else {
        systemGroupRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={systemGroupRef} position={[0, 0, -2]} visible={false}>
      {/* ========================================================
          1. CONDUIT PIPELINES (Semi-translucent with luminous core)
          ======================================================== */}
      <mesh geometry={geomGatewayToQueue}>
        <meshStandardMaterial color="#8271B5" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={geomQueueToWorker}>
        <meshStandardMaterial color="#8271B5" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={geomWorkerToDB}>
        <meshStandardMaterial color="#8271B5" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={geomGatewayToCache}>
        <meshStandardMaterial color="#FFA07A" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={geomCacheToDB}>
        <meshStandardMaterial color="#FFA07A" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
      </mesh>

      {/* ========================================================
          2. DATA PACKET SIGNALS (Traversing true Bezier pathways)
          ======================================================== */}
      <mesh ref={signal1Ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#EDE8FC" emissive="#EDE8FC" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={signal2Ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#B9A5F6" emissive="#B9A5F6" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={signal3Ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#8271B5" emissive="#B9A5F6" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={signal4Ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFA07A" emissive="#FFA07A" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={signal5Ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFA07A" emissive="#FFA07A" emissiveIntensity={2.5} />
      </mesh>

      {/* ========================================================
          3. ARCHITECTURAL SYSTEM NODES
          ======================================================== */}

      {/* NODE 1: API GATEWAY (Luminous Dual Crystalline Prism) */}
      <group position={[0, 1.8, 0]}>
        <group ref={gatewayRef}>
          <mesh castShadow>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial
              color="#B9A5F6"
              roughness={0.15}
              metalness={0.8}
              emissive="#8271B5"
              emissiveIntensity={0.4}
            />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.72, 0]} />
            <meshBasicMaterial color="#EDE8FC" wireframe transparent opacity={0.35} />
          </mesh>
        </group>
        {/* Floating Ingress Ring */}
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.75, 0.02, 16, 32]} />
          <meshStandardMaterial color="#EDE8FC" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* NODE 2: QUEUE HUB (Redis Streams / Concurrency Ring) */}
      <group position={[-2.2, 0.4, 0.2]}>
        <group ref={queueGroupRef}>
          {/* Outer Ring Housing */}
          <mesh ref={queueRingRef} castShadow>
            <torusGeometry args={[0.55, 0.08, 20, 36]} />
            <meshStandardMaterial
              color="#2A2A36"
              roughness={0.2}
              metalness={0.7}
              emissive="#8271B5"
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Inner Circulating Task Capsules */}
          {[0, 1, 2, 3].map((idx) => {
            const a = (idx * Math.PI) / 2;
            return (
              <mesh key={idx} position={[Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0]}>
                <capsuleGeometry args={[0.04, 0.12, 10, 10]} />
                <meshStandardMaterial color="#B9A5F6" emissive="#B9A5F6" emissiveIntensity={1.8} />
              </mesh>
            );
          })}
          {/* Core Central Hub */}
          <mesh>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color="#16161E" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* NODE 3: CACHE MATRIX (Sub-millisecond In-Memory Store) */}
      <group position={[2.2, 0.6, 0.1]}>
        <group ref={cacheRef}>
          {/* Central Coral Glow Core */}
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial
              color="#FFA07A"
              emissive="#FF6E4A"
              emissiveIntensity={1.6}
              roughness={0.2}
            />
          </mesh>
          {/* Protective Facet Chamfer Frame */}
          <mesh>
            <boxGeometry args={[0.72, 0.72, 0.72]} />
            <meshBasicMaterial color="#FFA07A" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      </group>

      {/* NODE 4: TRANSACTIONAL DATABASE (PostgreSQL ACID Vault) */}
      <group position={[1.4, -1.5, -0.3]}>
        <group ref={dbGroupRef}>
          {/* Tier 1 Disk Platter */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.18, 36]} />
            <meshStandardMaterial color="#2B2B38" roughness={0.2} metalness={0.7} />
          </mesh>
          {/* Platter Status Indicator Ring */}
          <mesh position={[0, 0.35, 0.56]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#55E6A5" />
          </mesh>

          {/* Tier 2 Disk Platter */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.18, 36]} />
            <meshStandardMaterial color="#8271B5" roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0.56]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#B9A5F6" />
          </mesh>

          {/* Tier 3 Disk Platter */}
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.18, 36]} />
            <meshStandardMaterial color="#2B2B38" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.25, 0.56]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#55E6A5" />
          </mesh>
        </group>
      </group>

      {/* NODE 5: AUTONOMOUS WORKERS (High-Throughput Daemon Cluster) */}
      <group position={[-1.5, -1.4, -0.2]}>
        <group ref={workerGroupRef}>
          {/* Worker Satellite 1 */}
          <mesh position={[0.42, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.24, 12, 12]} />
            <meshStandardMaterial color="#B9A5F6" emissive="#B9A5F6" emissiveIntensity={1.2} />
          </mesh>
          {/* Worker Satellite 2 */}
          <mesh position={[-0.42, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.24, 12, 12]} />
            <meshStandardMaterial color="#B9A5F6" emissive="#B9A5F6" emissiveIntensity={1.2} />
          </mesh>
          {/* Worker Satellite 3 */}
          <mesh position={[0, 0, 0.42]}>
            <capsuleGeometry args={[0.08, 0.24, 12, 12]} />
            <meshStandardMaterial color="#FFA07A" emissive="#FFA07A" emissiveIntensity={1.2} />
          </mesh>
          {/* Worker Satellite 4 */}
          <mesh position={[0, 0, -0.42]}>
            <capsuleGeometry args={[0.08, 0.24, 12, 12]} />
            <meshStandardMaterial color="#FFA07A" emissive="#FFA07A" emissiveIntensity={1.2} />
          </mesh>
        </group>
        {/* Central Supervisor Core */}
        <mesh>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#1E1E28" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
