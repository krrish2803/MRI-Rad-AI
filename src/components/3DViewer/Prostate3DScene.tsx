import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Lesion, PatientCase } from '../../types';

interface Prostate3DSceneProps {
  patient: PatientCase;
  selectedLesionId: string | null;
  onSelectLesion: (lesion: Lesion) => void;
  axialSliceIndex: number;
  maxAxialSlices: number;
  showCapsule?: boolean;
  showPZ?: boolean;
  showTZ?: boolean;
  showUrethra?: boolean;
  showSlicingPlane?: boolean;
  wireframe?: boolean;
  opacity?: number;
}

// Lesion Sphere with pulsing animation and click handler
const LesionMesh: React.FC<{
  lesion: Lesion;
  isSelected: boolean;
  onClick: () => void;
}> = ({ lesion, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulse animation for detected lesion
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scaleBase = 1;
      const pulseSpeed = lesion.risk === 'high' ? 3.5 : 2.0;
      const pulseAmplitude = isSelected ? 0.18 : 0.08;
      const s = scaleBase + Math.sin(time * pulseSpeed) * pulseAmplitude;
      meshRef.current.scale.set(s, s, s);
    }
    if (glowRef.current) {
      const time = state.clock.getElapsedTime();
      const s = 1.3 + Math.sin(time * 2) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }
  });

  const color = useMemo(() => {
    if (lesion.risk === 'high') return new THREE.Color('#dc3545'); // Danger Red
    if (lesion.risk === 'medium') return new THREE.Color('#f59e0b'); // Amber Warning
    return new THREE.Color('#10b981'); // Green Low
  }, [lesion.risk]);

  // Scaled coordinates from real mm to 3D scene units
  const pos: [number, number, number] = [
    lesion.coordinates.x * 0.12,
    lesion.coordinates.z * 0.12, // map z to height
    lesion.coordinates.y * 0.12
  ];

  const radius = Math.max(0.4, (lesion.dimensions.lengthMm / 20) * 0.8);

  return (
    <group position={pos}>
      {/* Outer Uncertainty Halo / Confidence Gradient */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.5, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.35 : 0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main Core Lesion Mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.25}
          roughness={0.2}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>

      {/* Lesion Label Tag in 3D */}
      {(hovered || isSelected) && (
        <Html distanceFactor={15} position={[0, radius + 0.5, 0]}>
          <div className="bg-slate-900/95 border border-sky-500/60 text-white rounded-lg px-2.5 py-1.5 shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap text-[11px] leading-tight flex flex-col gap-0.5">
            <div className="flex items-center space-x-1 font-bold text-sky-300">
              <span className={`w-2 h-2 rounded-full ${lesion.risk === 'high' ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
              <span>{lesion.name}</span>
            </div>
            <div className="text-slate-300 text-[10px]">
              PI-RADS <span className="font-bold text-white">{lesion.piradsScore}</span> • Conf: {lesion.confidence}%
            </div>
            <div className="text-slate-400 text-[9px] font-mono">
              {lesion.dimensions.lengthMm}mm • {lesion.zone.split('-')[0].trim()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Anatomical Prostate Organ Model (Capsule, PZ, TZ, Urethra)
const ProstateAnatomy: React.FC<{
  showCapsule: boolean;
  showPZ: boolean;
  showTZ: boolean;
  showUrethra: boolean;
  wireframe: boolean;
  opacity: number;
}> = ({ showCapsule, showPZ, showTZ, showUrethra, wireframe, opacity }) => {
  return (
    <group>
      {/* 1. Outer Fibrous Prostatic Capsule (Chestnut/Ellipsoid morphology) */}
      {showCapsule && (
        <mesh scale={[3.2, 2.6, 2.8]} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={opacity * 0.25}
            roughness={0.1}
            transmission={0.6}
            thickness={0.5}
            wireframe={wireframe}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. Peripheral Zone (PZ - Posterior & Lateral crescent, ~70% prostate cancer origin) */}
      {showPZ && (
        <group position={[0, -0.2, -0.4]}>
          <mesh scale={[3.0, 2.4, 1.6]}>
            <sphereGeometry args={[0.9, 36, 36]} />
            <meshStandardMaterial
              color="#0284c7"
              transparent
              opacity={opacity * 0.35}
              roughness={0.4}
              wireframe={wireframe}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* 3. Transition Zone (TZ - Bilateral lobes surrounding the urethra) */}
      {showTZ && (
        <group position={[0, 0.2, 0.4]}>
          {/* Right TZ Lobe */}
          <mesh position={[0.7, 0, 0]} scale={[1.2, 1.4, 1.2]}>
            <sphereGeometry args={[0.7, 28, 28]} />
            <meshStandardMaterial
              color="#0ea5e9"
              transparent
              opacity={opacity * 0.3}
              roughness={0.5}
              wireframe={wireframe}
              depthWrite={false}
            />
          </mesh>
          {/* Left TZ Lobe */}
          <mesh position={[-0.7, 0, 0]} scale={[1.2, 1.4, 1.2]}>
            <sphereGeometry args={[0.7, 28, 28]} />
            <meshStandardMaterial
              color="#0ea5e9"
              transparent
              opacity={opacity * 0.3}
              roughness={0.5}
              wireframe={wireframe}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* 4. Prostatic Urethra (Central canal passing apex to base) */}
      {showUrethra && (
        <mesh position={[0, 0, 0.1]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 5.2, 24]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#0891b2"
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* 5. Posterior Neurovascular Bundles (NVB - lateral surgical margins) */}
      <mesh position={[2.6, 0, -1.8]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.08, 0.08, 5.0, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-2.6, 0, -1.8]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.08, 0.08, 5.0, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// Slicing Plane synced with 2D slice scrubber
const AxialSliceCuttingPlane: React.FC<{
  currentSlice: number;
  totalSlices: number;
}> = ({ currentSlice, totalSlices }) => {
  // Map slice [0, totalSlices-1] to Y position in 3D scene [-2.2, 2.2]
  const yPos = ((currentSlice / (totalSlices - 1)) - 0.5) * 4.4;

  return (
    <group position={[0, yPos, 0]}>
      {/* Semi-transparent plane representing current 2D axial cut */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 7.2]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer grid boundary line */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(7.2, 7.2)]} />
        <lineBasicMaterial color="#0284c7" linewidth={1.5} />
      </lineSegments>
    </group>
  );
};

export const Prostate3DScene: React.FC<Prostate3DSceneProps> = ({
  patient,
  selectedLesionId,
  onSelectLesion,
  axialSliceIndex,
  maxAxialSlices,
  showCapsule = true,
  showPZ = true,
  showTZ = true,
  showUrethra = true,
  showSlicingPlane = true,
  wireframe = false,
  opacity = 0.7,
}) => {
  const controlsRef = useRef<any>(null);

  return (
    <div className="w-full h-full relative bg-slate-950 select-none webgl-container">
      <Canvas
        camera={{ position: [5.5, 4.5, 6.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        <color attach="background" args={['#080d19']} />
        
        {/* Medical Studio Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#38bdf8" />

        {/* Anatomical Organ Model */}
        <ProstateAnatomy
          showCapsule={showCapsule}
          showPZ={showPZ}
          showTZ={showTZ}
          showUrethra={showUrethra}
          wireframe={wireframe}
          opacity={opacity}
        />

        {/* Axial Slicing Cut Plane */}
        {showSlicingPlane && (
          <AxialSliceCuttingPlane
            currentSlice={axialSliceIndex}
            totalSlices={maxAxialSlices}
          />
        )}

        {/* Detected Volumetric Lesions */}
        {patient.lesions.map((lesion) => (
          <LesionMesh
            key={lesion.id}
            lesion={lesion}
            isSelected={selectedLesionId === lesion.id}
            onClick={() => onSelectLesion(lesion)}
          />
        ))}

        {/* Anatomical Orientation Markers */}
        <Text position={[0, 0, 3.8]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
          ANTERIOR (Ant)
        </Text>
        <Text position={[0, 0, -3.8]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
          POSTERIOR (Post)
        </Text>
        <Text position={[4.0, 0, 0]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
          RIGHT
        </Text>
        <Text position={[-4.0, 0, 0]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
          LEFT
        </Text>
        <Text position={[0, 2.7, 0]} fontSize={0.25} color="#38bdf8" anchorX="center" anchorY="middle">
          BASE (Cranial)
        </Text>
        <Text position={[0, -2.7, 0]} fontSize={0.25} color="#38bdf8" anchorX="center" anchorY="middle">
          APEX (Caudal)
        </Text>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.5}
          maxDistance={18}
          makeDefault
        />
      </Canvas>

      {/* 3D Viewport HUD Overlays */}
      <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 backdrop-blur-md">
        <div className="text-white font-semibold flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>Three.js Spatial Volume Render</span>
        </div>
        <div>Axial Cut: Slice {axialSliceIndex + 1}/{maxAxialSlices}</div>
        <div>Rotation: Interactive (Orbit / Zoom / Pan)</div>
        <div className="flex items-center space-x-2 pt-1">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="text-slate-300">PIRADS 4-5</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-300">PIRADS 3</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300">Benign</span>
          </span>
        </div>
      </div>
    </div>
  );
};
