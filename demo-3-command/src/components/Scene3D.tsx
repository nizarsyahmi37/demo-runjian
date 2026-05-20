import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PLANTS } from '../data';
import type { Plant } from '../types';

interface Props {
  selectedPlantId: string | null;
  onSelectPlant: (p: Plant | null) => void;
  onPeekAction?: (action: string, plantId: string) => void;
  actionBar?: React.ReactNode;
}

const PLANT_3D_POS: Record<string, [number, number, number]> = {
  kedah:  [-28, 0, -22],
  penang: [  0, 0, -30],
  perak:  [ 28, 0, -22],
  melaka: [-18, 0,  22],
  johor:  [ 18, 0,  22],
};

export function Scene3D({ selectedPlantId, onSelectPlant, actionBar }: Props) {
  return (
    <section className="stage stage-3d" id="stage">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 38, 55], fov: 38, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={['#dceaf6', '#cfd7e0', 0.85]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 60, 20]} intensity={1.6} castShadow />
        <color attach="background" args={['#e9eef6']} />

        {/* Ground */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[260, 260]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
        <gridHelper args={[260, 52, '#cbd6e2', '#dde6f0']} position={[0, 0.01, 0]} />

        {/* River */}
        <mesh receiveShadow position={[-44, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 180]} />
          <meshStandardMaterial color="#7da6c6" transparent opacity={.85} />
        </mesh>

        <Mountains />
        <WindFarm origin={[-38, 0, -34]} />
        <WindFarm origin={[ 38, 0, -34]} />

        {PLANTS.map(p => (
          <PlantCluster
            key={p.id}
            plant={p}
            position={PLANT_3D_POS[p.id]}
            selected={p.id === selectedPlantId}
            onSelect={() => onSelectPlant(p)}
          />
        ))}

        <AdminTower />
        <SolarFarm origin={[-12, 0, -10]} cols={8} rows={6} />
        <SolarFarm origin={[ 12, 0, -10]} cols={8} rows={6} />
        <SolarFarm origin={[  0, 0,  18]} cols={12} rows={4} />

        <TxTower position={[-22, 0, -28]} />
        <TxTower position={[ 22, 0, -28]} />
        <TxTower position={[-22, 0,  20]} />
        <TxTower position={[ 22, 0,  20]} />

        <Drone />

        <Vehicle path="loop-a" speed={6} color="#ffffff" />
        <Vehicle path="loop-b" speed={5} color="#fbbf24" />
        <Vehicle path="loop-c" speed={7} color="#f43f5e" />

        <Html position={[-22, 14, -28]} center distanceFactor={20}><Poi label="TX Tower A" /></Html>
        <Html position={[ 22, 14, -28]} center distanceFactor={20}><Poi label="TX Tower B" /></Html>
        <Html position={[-38, 9, -34]} center distanceFactor={20}><Poi label="Wind Farm" /></Html>
        <Html position={[ 38, 9, -34]} center distanceFactor={20}><Poi label="Wind Farm" /></Html>
        <Html position={[  0,  4,  10]} center distanceFactor={20}><Poi label="Battery Bank" status="warn" /></Html>
        <Html position={[  0, 22,   0]} center distanceFactor={20}><Poi label="Admin Tower" /></Html>

        <OrbitControls
          target={[0, 4, 0]}
          enableDamping
          minDistance={30}
          maxDistance={140}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {actionBar}
    </section>
  );
}

function Poi({ label, status = 'ok' }: { label: string; status?: 'ok' | 'warn' | 'crit' }) {
  return (
    <div className={`scene-poi scene-poi-${status}`}>
      <div className="scene-poi-dot"/>
      <div className="scene-poi-label">{label}</div>
    </div>
  );
}

function PlantCluster({ plant, position, selected, onSelect }:
  { plant: Plant; position: [number, number, number]; selected: boolean; onSelect: () => void }) {
  const isAlert = plant.status === 'critical';
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[5.6, 5.6, 0.1, 36]} />
        <meshStandardMaterial color={isAlert ? '#fde2e7' : '#dbe7f3'} roughness={1} />
      </mesh>
      <mesh position={[-1.6, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 2.6]} />
        <meshStandardMaterial color="#e3ecf6" roughness={.9} />
      </mesh>
      <mesh position={[1.6, 1.35, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.6, 2.4]} />
        <meshStandardMaterial color={isAlert ? '#f3b9c1' : '#cfdaea'} roughness={.85} />
      </mesh>
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * 1.1, 0.08, 2.4]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1, 0.04, 1.4]} />
          <meshStandardMaterial color="#1e3a5f" metalness={.4} roughness={.35} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.0, 6.4, 64]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={.85}/>
        </mesh>
      )}
      {isAlert && <PulseRing />}
      <Html position={[0, 5.5, 0]} center distanceFactor={18}>
        <div className={`plant-poi ${isAlert ? 'crit' : 'ok'}`} onClick={onSelect}>
          <div className="plant-poi-dot" />
          <div className="plant-poi-card">
            <div className="plant-poi-name">{plant.name.split('-')[0]}</div>
            <div className="plant-poi-pwr">{plant.capMW < 1 ? `${Math.round(plant.capMW * 1000)} kWp` : `${plant.capMW.toFixed(2)} MWp`}</div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function PulseRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime % 1.6) / 1.6;
    ref.current.scale.set(1 + t * 0.8, 1 + t * 0.8, 1 + t * 0.8);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[5.8, 6.2, 64]} />
      <meshBasicMaterial color="#f43f5e" transparent opacity={.8}/>
    </mesh>
  );
}

function AdminTower() {
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[6, 6, 0.8, 32]} />
        <meshStandardMaterial color="#dde6f0" roughness={.95} />
      </mesh>
      <mesh position={[0, 9.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 18, 5]} />
        <meshStandardMaterial color="#cfd9e6" metalness={.45} roughness={.18} />
      </mesh>
      {[2, 5.5, 9, 12.5, 16].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[5.05, .35, 5.05]} />
          <meshStandardMaterial color="#7fa6d6" emissive="#83b3e4" emissiveIntensity={.35} />
        </mesh>
      ))}
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
}

function SolarFarm({ origin, cols, rows }: { origin: [number, number, number]; cols: number; rows: number }) {
  const positions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    const sp = 1.4;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        out.push([origin[0] + (i - cols / 2) * sp, 0.05, origin[2] + (j - rows / 2) * sp]);
    return out;
  }, [origin, cols, rows]);
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p} rotation={[-Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1.0, 0.04, 1.2]} />
          <meshStandardMaterial color="#1e3a5f" metalness={.5} roughness={.25} />
        </mesh>
      ))}
    </group>
  );
}

function WindFarm({ origin }: { origin: [number, number, number] }) {
  const [ox, oy, oz] = origin;
  return (
    <group position={[ox, oy, oz]}>
      {[-6, 0, 6].map((dx, i) => <WindTurbine key={i} position={[dx, 0, (i % 2 ? -2 : 0)]} phase={i * 0.4} />)}
    </group>
  );
}

function WindTurbine({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bladesRef.current) bladesRef.current.rotation.z = clock.elapsedTime * 1.4 + phase;
  });
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 9, 12]} />
        <meshStandardMaterial color="#f4f6f8" roughness={.9}/>
      </mesh>
      <mesh position={[0, 9.1, 0.2]}>
        <boxGeometry args={[0.6, 0.5, 1]} />
        <meshStandardMaterial color="#e4ebf3" />
      </mesh>
      <group ref={bladesRef} position={[0, 9.1, 0.8]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.15, 4, 0.05]} />
            <meshStandardMaterial color="#f4f6f8" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TxTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 9, 8]} />
        <meshStandardMaterial color="#5c6877" />
      </mesh>
      {[1, 3.5, 6, 8].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.4, .07, .07]} />
          <meshStandardMaterial color="#5c6877" />
        </mesh>
      ))}
    </group>
  );
}

function Drone() {
  const drone = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18;
    const r = 30 + Math.sin(t * 0.7) * 4;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    const y = 12 + Math.sin(t * 1.6) * 1.2;
    if (drone.current) drone.current.position.set(x, y, z);
    if (shadow.current) shadow.current.position.set(x, 0.05, z);
  });
  return (
    <>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.3}>
        <group ref={drone}>
          <mesh castShadow>
            <boxGeometry args={[1, .3, 1]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {[[-0.7, 0, -0.7], [0.7, 0, -0.7], [-0.7, 0, 0.7], [0.7, 0, 0.7]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.5, 24]} />
              <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={.7} transparent opacity={.55} />
            </mesh>
          ))}
        </group>
      </Float>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={.32}/>
      </mesh>
    </>
  );
}

function Vehicle({ path, speed, color }: { path: 'loop-a' | 'loop-b' | 'loop-c'; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    if (path === 'loop-a') {
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * 30, 0.4, Math.sin(a) * 30));
      }
    } else if (path === 'loop-b') {
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const r = 18 + Math.sin(a * 2) * 4;
        points.push(new THREE.Vector3(Math.cos(a) * r, 0.4, Math.sin(a) * r));
      }
    } else {
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * 12, 0.4, Math.sin(a) * 22));
      }
    }
    return new THREE.CatmullRomCurve3(points, true, 'centripetal');
  }, [path]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * speed * 0.01) % 1;
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ref.current.position.copy(pos);
    ref.current.lookAt(pos.x + tan.x, pos.y + tan.y, pos.z + tan.z);
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.7, 0.9]} />
        <meshStandardMaterial color={color} metalness={.5} roughness={.4}/>
      </mesh>
      <mesh position={[-0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.85]} />
        <meshStandardMaterial color={color} metalness={.4} roughness={.5}/>
      </mesh>
    </group>
  );
}

function Mountains() {
  const peaks = useMemo(() => {
    const out: { p: [number, number, number]; s: number }[] = [];
    for (let i = -7; i <= 7; i++) {
      const x = i * 9 + (Math.random() * 4 - 2);
      const z = -78 + Math.random() * 6;
      const s = 10 + Math.random() * 14;
      out.push({ p: [x, s / 2, z], s });
    }
    return out;
  }, []);
  return (
    <>
      {peaks.map((m, i) => (
        <mesh key={i} position={m.p} castShadow>
          <coneGeometry args={[m.s * .55, m.s, 14]} />
          <meshStandardMaterial color="#dde6f0" roughness={1} />
        </mesh>
      ))}
    </>
  );
}
