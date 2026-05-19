/**
 * Road network + live actors on the iso map.
 *
 * Everything is in a single SVG so all motion is on the same coordinate system
 * (the SVG viewBox is 0–100 in both axes, mapped to the map-world container).
 *
 *  • invisible road paths (id="rd-…") trace the major arteries on the iso art
 *  • data-flow orbs travel along those paths (the "power grid" feel)
 *  • cars + vans + service trucks are small SVG rects with animateMotion + rotate
 *  • technicians are dots with concentric "wearable broadcast" rings around them
 *  • drones / helicopter fly free above the network
 *
 * Adding/changing a route = add a new <path id="rd-X"/> below, then reference it
 * in any number of `<animateMotion><mpath href="#rd-X"/></animateMotion>` calls.
 */

const ORB_FILL_PURPLE = 'url(#orb-grad-purple)';
const ORB_FILL_TEAL   = 'url(#orb-grad-teal)';
const ORB_FILL_AMBER  = 'url(#orb-grad-amber)';

/** Helper to spawn N data orbs along a road id with staggered begin offsets. */
function orbsOn(road: string, count: number, dur: number, fill: string, r = 0.7, beginShift = 0) {
  const out: JSX.Element[] = [];
  for (let i = 0; i < count; i++) {
    const begin = (dur * i) / count + beginShift;
    out.push(
      <circle key={`${road}-${i}`} r={r} fill={fill} filter="url(#orb-blur)">
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} rotate="0">
          <mpath href={`#${road}`} />
        </animateMotion>
      </circle>
    );
  }
  return out;
}

export function RoadNetwork() {
  return (
    <svg className="road-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="orb-grad-purple">
          <stop offset="0%"  stopColor="#f5f3ff" stopOpacity="1"/>
          <stop offset="35%" stopColor="#c4b5fd" stopOpacity=".95"/>
          <stop offset="70%" stopColor="#a855f7" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-grad-teal">
          <stop offset="0%"  stopColor="#ccfbf1" stopOpacity="1"/>
          <stop offset="40%" stopColor="#5eead4" stopOpacity=".85"/>
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-grad-amber">
          <stop offset="0%"  stopColor="#fef3c7" stopOpacity="1"/>
          <stop offset="40%" stopColor="#fcd34d" stopOpacity=".9"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>

        <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".35"/>
        </filter>
        <filter id="actor-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation=".15"/>
        </filter>
        <filter id="wearable-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation=".5"/>
        </filter>
      </defs>

      {/* ============================================================
         INVISIBLE ROAD PATHS — traced along the iso road grid.
         Coordinates picked from the actual map image's road layout.
         ============================================================ */}

      {/* Horizontal arteries — subtle violet glow so the network reads as a "grid" */}
      <path id="rd-h1" d="M2,20  L98,20"  stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h2" d="M2,38  L98,38"  stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h3" d="M2,55  L98,55"  stroke="rgba(196, 181, 253, .24)" strokeWidth=".3"  fill="none"/>
      <path id="rd-h4" d="M2,72  L98,72"  stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-h5" d="M2,87  L98,87"  stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>

      {/* Vertical arteries */}
      <path id="rd-v1" d="M14,2 L14,98" stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v2" d="M32,2 L32,98" stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v3" d="M50,2 L50,98" stroke="rgba(196, 181, 253, .24)" strokeWidth=".3"  fill="none"/>
      <path id="rd-v4" d="M68,2 L68,98" stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>
      <path id="rd-v5" d="M86,2 L86,98" stroke="rgba(196, 181, 253, .18)" strokeWidth=".25" fill="none"/>

      {/* Loop routes — used for patrols */}
      <path id="rd-loop-outer" d="M6,16 L94,16 L94,90 L6,90 Z" stroke="rgba(196, 181, 253, .14)" strokeWidth=".22" fill="none"/>
      <path id="rd-loop-inner" d="M22,30 L78,30 L78,80 L22,80 Z" stroke="rgba(196, 181, 253, .14)" strokeWidth=".22" fill="none"/>

      {/* Aerial paths (drone, helicopter) — curved sweeps */}
      <path id="ar-drone-1"  d="M5,10 Q 50,5  95,15  Q 95,55 60,52  Q 30,50 20,80  Q 50,95 90,80" stroke="none" fill="none"/>
      <path id="ar-heli-1"   d="M-5,30 Q 50,8 105,40 Q 80,70 50,60 Q 20,55 -5,30" stroke="none" fill="none"/>

      {/* ============================================================
         DATA-FLOW ORBS — distributed all along the road network.
         Each road gets several orbs at different speeds + colors.
         ============================================================ */}
      <g>
        {orbsOn('rd-h1', 5, 14, ORB_FILL_PURPLE, 1.3)}
        {orbsOn('rd-h2', 6, 16, ORB_FILL_TEAL,   1.2)}
        {orbsOn('rd-h3', 7, 18, ORB_FILL_PURPLE, 1.3)}
        {orbsOn('rd-h4', 6, 17, ORB_FILL_TEAL,   1.2)}
        {orbsOn('rd-h5', 5, 15, ORB_FILL_AMBER,  1.15)}

        {orbsOn('rd-v1', 4, 18, ORB_FILL_PURPLE, 1.2)}
        {orbsOn('rd-v2', 5, 20, ORB_FILL_TEAL,   1.15)}
        {orbsOn('rd-v3', 6, 16, ORB_FILL_PURPLE, 1.3)}
        {orbsOn('rd-v4', 5, 20, ORB_FILL_TEAL,   1.15)}
        {orbsOn('rd-v5', 4, 17, ORB_FILL_AMBER,  1.2)}

        {/* outer-loop ambient orbs */}
        {orbsOn('rd-loop-outer', 8, 32, ORB_FILL_PURPLE, 1.0)}
      </g>

      {/* ============================================================
         VEHICLES — cars + vans + trucks, bigger so they read at all zooms
         ============================================================ */}
      <g className="vehicles">
        {/* Yellow utility cars on horizontal roads */}
        <Vehicle road="rd-h1" dur={26} color="#fbbf24" w={3.4} h={1.7}/>
        <Vehicle road="rd-h2" dur={32} color="#fbbf24" w={3.4} h={1.7} reverse begin={4}/>
        <Vehicle road="rd-h3" dur={28} color="#fde68a" w={3.0} h={1.5} begin={9}/>
        <Vehicle road="rd-h4" dur={30} color="#fbbf24" w={3.4} h={1.7} reverse begin={2}/>

        {/* Service vans (white) on vertical arteries — bright halo */}
        <Vehicle road="rd-v2" dur={36} color="#f8fafc" w={4.0} h={2.0} halo="#c4b5fd" begin={3}/>
        <Vehicle road="rd-v4" dur={34} color="#f8fafc" w={4.0} h={2.0} halo="#c4b5fd" reverse begin={11}/>

        {/* Patrol trucks running the outer/inner loops */}
        <Vehicle road="rd-loop-outer" dur={56} color="#fb923c" w={3.8} h={1.8} halo="#fcd34d" rotate/>
        <Vehicle road="rd-loop-inner" dur={48} color="#a855f7" w={3.4} h={1.7} halo="#c4b5fd" rotate reverse begin={6}/>
      </g>

      {/* ============================================================
         TECHNICIANS — small green dots w/ wearable broadcast rings.
         They walk slow loops near key substations / solar arrays.
         ============================================================ */}
      <g className="techs">
        <Technician road="rd-h2" dur={70} begin={0}/>
        <Technician road="rd-h4" dur={84} begin={14}/>
        <Technician road="rd-v3" dur={92} begin={5}/>
        <Technician road="rd-loop-inner" dur={120} begin={20}/>
      </g>

      {/* ============================================================
         AERIAL UNITS — drone + helicopter, on free flight paths
         (free of the road grid; we render them inside the SVG so they
          share the same coordinate system & rotate-on-path).
         ============================================================ */}
      <g className="aerial">
        {/* Drone: bright cyan glow with rotor */}
        <g>
          <circle r="1.0" fill="#67e8f9" filter="url(#wearable-glow)"/>
          <circle r="2.0" fill="none" stroke="#67e8f9" strokeWidth=".22" opacity=".8">
            <animate attributeName="r" values="1.0;2.4;1.0" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle r="0.55" fill="#ecfeff"/>
          <animateMotion dur="42s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ar-drone-1"/>
          </animateMotion>
        </g>
        {/* Helicopter: orange glow with rotor wash */}
        <g>
          <rect x="-1.6" y="-0.55" width="3.2" height="1.1" rx="0.5" fill="#fb923c" opacity=".98"/>
          <rect x="-0.3" y="-1.4"  width="0.6" height="2.8" rx="0.2" fill="#fcd34d" opacity=".7">
            <animate attributeName="opacity" values=".7;.1;.7" dur=".15s" repeatCount="indefinite"/>
          </rect>
          <circle r="2.2" fill="none" stroke="#fb923c" strokeWidth=".26" opacity=".55">
            <animate attributeName="r" values="1.6;2.8;1.6" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values=".8;0;.8" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <animateMotion dur="36s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ar-heli-1"/>
          </animateMotion>
        </g>
      </g>
    </svg>
  );
}

/* ---------- vehicle component (rect on a road path) ---------- */
function Vehicle({
  road, dur, color, w, h, halo, reverse, rotate, begin = 0,
}: {
  road: string; dur: number; color: string; w: number; h: number;
  halo?: string; reverse?: boolean; rotate?: boolean; begin?: number;
}) {
  const keyTimes  = reverse ? '1;0' : '0;1';
  const keyPoints = reverse ? '1;0' : '0;1';
  return (
    <g>
      {halo && (
        <ellipse rx={w * 1.3} ry={h * 1.6} fill={halo} opacity=".22" filter="url(#wearable-glow)"/>
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(w, h) * 0.35} fill={color} filter="url(#actor-blur)"/>
      {/* a small windshield highlight */}
      <rect x={-w * 0.35} y={-h * 0.3} width={w * 0.3} height={h * 0.55} fill="rgba(255,255,255,.55)" rx=".15"/>
      <animateMotion
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
        rotate={rotate ? 'auto' : '0'}
        keyPoints={keyPoints}
        keyTimes={keyTimes}
        calcMode="linear"
      >
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}

/* ---------- technician with wearable broadcast rings ---------- */
function Technician({ road, dur, begin = 0 }: { road: string; dur: number; begin?: number }) {
  return (
    <g>
      {/* core body — bright green dot */}
      <circle r="0.9" fill="#34d399" filter="url(#wearable-glow)" />
      <circle r="0.5" fill="#ecfeff" />
      {/* wearable broadcast: 2 expanding rings, staggered */}
      <circle r="0.9" fill="none" stroke="#34d399" strokeWidth=".24" opacity="0">
        <animate attributeName="r"       values=".9;3.0;.9"  dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".95;0;0;.95" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle r="0.9" fill="none" stroke="#34d399" strokeWidth=".18" opacity="0">
        <animate attributeName="r"       values=".9;3.0;.9"  dur="2.2s" begin="1.1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".95;0;0;.95" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
      </circle>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
        <mpath href={`#${road}`} />
      </animateMotion>
    </g>
  );
}
