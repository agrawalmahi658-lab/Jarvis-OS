"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Stars } from "@react-three/drei";
import * as THREE from "three";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface Orb3DProps {
  state?: OrbState;
  size?: number;
  className?: string;
}

// State-based color configurations
const stateColors: Record<
  OrbState,
  {
    primary: THREE.Color;
    secondary: THREE.Color;
    emissive: THREE.Color;
    intensity: number;
  }
> = {
  idle: {
    primary: new THREE.Color("#00d4ff"),
    secondary: new THREE.Color("#0099cc"),
    emissive: new THREE.Color("#00d4ff"),
    intensity: 0.6,
  },
  listening: {
    primary: new THREE.Color("#00ff88"),
    secondary: new THREE.Color("#00cc66"),
    emissive: new THREE.Color("#00ff88"),
    intensity: 0.9,
  },
  thinking: {
    primary: new THREE.Color("#ffaa00"),
    secondary: new THREE.Color("#ff8800"),
    emissive: new THREE.Color("#ffaa00"),
    intensity: 1.0,
  },
  speaking: {
    primary: new THREE.Color("#00d4ff"),
    secondary: new THREE.Color("#00ffff"),
    emissive: new THREE.Color("#00ffff"),
    intensity: 0.8,
  },
};

// Floating particles around the orb
function OrbitalParticles({
  count = 80,
  state,
}: {
  count?: number;
  state: OrbState;
}) {
  const mesh = useRef<THREE.Points | null>(null);
  const colors = stateColors[state];

  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 1.5;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      siz[i] = Math.random() * 0.08 + 0.02;
    }

    return [pos, vel, siz] as const;
  }, [count]);

  useFrame((_, delta) => {
    if (!mesh.current) return;

    const geom = mesh.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const speedMultiplier =
      state === "thinking" ? 3 : state === "listening" ? 2 : 1;

    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3] * delta * 60 * speedMultiplier;
      posArray[i * 3 + 1] +=
        velocities[i * 3 + 1] * delta * 60 * speedMultiplier;
      posArray[i * 3 + 2] +=
        velocities[i * 3 + 2] * delta * 60 * speedMultiplier;

      // Keep particles in orbital range
      const x = posArray[i * 3];
      const y = posArray[i * 3 + 1];
      const z = posArray[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);

      if (dist > 3.5 || dist < 1.2) {
        velocities[i * 3] *= -1;
        velocities[i * 3 + 1] *= -1;
        velocities[i * 3 + 2] *= -1;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={colors.primary}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Holographic ring
function HolographicRing({
  radius,
  rotationSpeed,
  tilt,
  state,
  thickness = 0.02,
}: {
  radius: number;
  rotationSpeed: number;
  tilt: [number, number, number];
  state: OrbState;
  thickness?: number;
}) {
  const ref = useRef<THREE.Mesh | null>(null);
  const colors = stateColors[state];

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * rotationSpeed;
  });

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshBasicMaterial
        color={colors.primary}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Energy arc segment on rings
function EnergyArc({
  radius,
  state,
  offset = 0,
}: {
  radius: number;
  state: OrbState;
  offset?: number;
}) {
  const ref = useRef<THREE.Mesh | null>(null);
  const colors = stateColors[state];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + offset;
    ref.current.rotation.z = t * 1.5;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry
        args={[radius, 0.04, 8, 12, Math.PI * 0.3]}
      />
      <meshBasicMaterial
        color={colors.emissive}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Main core orb with distortion
function CoreOrb({ state }: { state: OrbState }) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const colors = stateColors[state];

  const [distortionSpeed, setDistortionSpeed] = useState(0.5);
  const [distortionAmount, setDistortionAmount] = useState(0.3);

  useEffect(() => {
    switch (state) {
      case "listening":
        setDistortionSpeed(2);
        setDistortionAmount(0.4);
        break;
      case "thinking":
        setDistortionSpeed(4);
        setDistortionAmount(0.5);
        break;
      case "speaking":
        setDistortionSpeed(1.5);
        setDistortionAmount(0.35);
        break;
      default:
        setDistortionSpeed(0.5);
        setDistortionAmount(0.3);
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;

    const t = clock.getElapsedTime();

    // Breathing animation
    const breathe = 1 + Math.sin(t * 1.5) * 0.05;
    meshRef.current.scale.setScalar(breathe);

    // Pulse on speaking
    if (state === "speaking") {
      const pulse = 1 + Math.sin(t * 8) * 0.03;
      meshRef.current.scale.multiplyScalar(pulse);
    }

    // Glow pulse
    const glowPulse = 1.1 + Math.sin(t * 2) * 0.1;
    glowRef.current.scale.setScalar(glowPulse);
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Outer glow */}
      <Sphere ref={glowRef} args={[1.15, 32, 32]}>
        <meshBasicMaterial
          color={colors.primary}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Main orb with distortion */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={colors.primary}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
          roughness={0.1}
          metalness={0.8}
          distort={distortionAmount}
          speed={distortionSpeed}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Inner core */}
      <Sphere args={[0.7, 32, 32]}>
        <meshBasicMaterial
          color={colors.secondary}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Energy nucleus */}
      <Sphere args={[0.3, 16, 16]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </Sphere>
    </Float>
  );
}

// Reactive pulse wave (FIXED: removed setState inside useFrame)
function PulseWave({ state }: { state: OrbState }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const colors = stateColors[state];

  const scaleRef = useRef(1);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const isActive = state === "speaking" || state === "thinking";

    if (isActive) {
      scaleRef.current = Math.min(3, scaleRef.current + delta * 2);
      opacityRef.current = Math.max(0, 1 - (scaleRef.current - 1) / 2);
    } else {
      scaleRef.current = 1;
      opacityRef.current = 0;
    }

    ref.current.scale.setScalar(scaleRef.current);

    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacityRef.current * 0.5;
  });

  return (
    <mesh ref={ref} scale={[1, 1, 1]}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial
        color={colors.emissive}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Data streams flowing toward orb
function DataStreams({ state }: { state: OrbState }) {
  const count = 6;
  const refs = useRef<Array<THREE.Points | null>>(
    Array.from({ length: count }, () => null)
  );
  const colors = stateColors[state];

  const streams = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const positions = new Float32Array(30 * 3);

      for (let j = 0; j < 30; j++) {
        const r = 2 + j * 0.1;
        positions[j * 3] = Math.cos(angle) * r;
        positions[j * 3 + 1] = (j - 15) * 0.1;
        positions[j * 3 + 2] = Math.sin(angle) * r;
      }

      return { positions, angle };
    });
  }, []);

  useFrame(({ clock }) => {
    if (state !== "thinking" && state !== "listening") return;

    const t = clock.getElapsedTime();

    refs.current.forEach((ref, i) => {
      if (!ref) return;

      const posAttr = ref.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let j = 0; j < 30; j++) {
        const phase = (t * 2 + j * 0.2 + i * 0.5) % 3;
        const r = 2 + j * 0.1 - phase * 0.5;

        posArray[j * 3] =
          Math.cos(streams[i].angle) * Math.max(0.5, r);
        posArray[j * 3 + 2] =
          Math.sin(streams[i].angle) * Math.max(0.5, r);
      }

      posAttr.needsUpdate = true;
    });
  });

  if (state !== "thinking" && state !== "listening") return null;

  return (
    <>
      {streams.map((stream, i) => (
        <points
          key={i}
          ref={(el) => {
            refs.current[i] = el as THREE.Points;
          }}
        >
          <bufferGeometry>
           <bufferAttribute
          attach="attributes-position"
          args={[stream.positions, 3]}
/>
            
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color={colors.primary}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}

// Scene composition
function OrbScene({ state }: { state: OrbState }) {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight
        position={[-10, -10, -10]}
        intensity={0.3}
        color="#00d4ff"
      />

      {/* Background stars */}
      <Stars radius={50} depth={50} count={1000} factor={2} saturation={0} fade speed={0.5} />

      {/* Core orb */}
      <CoreOrb state={state} />

      {/* Orbital particles */}
      <OrbitalParticles count={100} state={state} />

      {/* Holographic rings */}
      <HolographicRing
        radius={1.8}
        rotationSpeed={0.3}
        tilt={[Math.PI * 0.4, 0, 0]}
        state={state}
      />
      <HolographicRing
        radius={2.2}
        rotationSpeed={-0.2}
        tilt={[Math.PI * 0.5, Math.PI * 0.2, 0]}
        state={state}
      />
      <HolographicRing
        radius={2.6}
        rotationSpeed={0.15}
        tilt={[Math.PI * 0.3, Math.PI * 0.4, 0]}
        state={state}
        thickness={0.015}
      />

      {/* Energy arcs */}
      <group rotation={[Math.PI * 0.4, 0, 0]}>
        <EnergyArc radius={1.8} state={state} offset={0} />
        <EnergyArc radius={1.8} state={state} offset={Math.PI} />
      </group>
      <group rotation={[Math.PI * 0.5, Math.PI * 0.2, 0]}>
        <EnergyArc radius={2.2} state={state} offset={Math.PI * 0.5} />
        <EnergyArc radius={2.2} state={state} offset={Math.PI * 1.5} />
      </group>

      {/* Pulse waves */}
      <PulseWave state={state} />

      {/* Data streams */}
      <DataStreams state={state} />
    </>
  );
}

export function Orb3D({
  state = "idle",
  size = 300,
  className = "",
}: Orb3DProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, background: "transparent" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <OrbScene state={state} />
      </Canvas>
    </div>
  );
}

export default Orb3D;

