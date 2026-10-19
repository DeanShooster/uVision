import { useReducedMotion } from '../../hooks/useReducedMotion';

const SUN = { x: 150, y: 80 };

const LOBBY_PLANETS = [
  { id: 'mercury', rx: 22, ry: 9, r: 2.1, color: '#c8beb2', dur: 8, offset: 1.2, angle: 0.5 },
  { id: 'venus', rx: 34, ry: 14, r: 3.1, color: '#e6cc8c', dur: 12, offset: 4.4, angle: 2.2 },
  { id: 'earth', rx: 46, ry: 19, r: 3.3, color: '#2f74c8', dur: 16, offset: 9, angle: 4.1, moon: true },
  { id: 'mars', rx: 58, ry: 24, r: 2.5, color: '#c4623a', dur: 21, offset: 6, angle: 1.1 },
  { id: 'jupiter', rx: 86, ry: 35, r: 6.6, color: '#e2c093', dur: 30, offset: 8, angle: 1.8, bands: true },
  { id: 'saturn', rx: 106, ry: 43, r: 5.4, color: '#ecd7a8', dur: 38, offset: 20, angle: 3.4, rings: true },
  { id: 'uranus', rx: 122, ry: 49, r: 3.8, color: '#8ee0d8', dur: 46, offset: 14, angle: 5.2 },
  { id: 'neptune', rx: 136, ry: 55, r: 3.6, color: '#3a5ed0', dur: 54, offset: 30, angle: 2.5 },
];

const BELT_ROCKS = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + (index % 4) * 0.08;
  const spread = 0.9 + (index % 5) * 0.045;
  return {
    x: SUN.x + Math.cos(angle) * 71 * spread,
    y: SUN.y + Math.sin(angle) * 29 * spread,
    r: index % 6 === 0 ? 1.15 : 0.65,
    fill: index % 2 === 0 ? '#b1a28e' : '#6e675e',
  };
});

const LOBBY_STARS = [
  [18, 18, 0.8], [46, 34, 0.5], [72, 14, 0.6], [214, 22, 0.7], [258, 16, 0.5],
  [286, 38, 0.8], [24, 96, 0.5], [52, 128, 0.7], [236, 118, 0.6], [274, 132, 0.5],
  [198, 12, 0.4], [124, 142, 0.5], [96, 20, 1], [168, 146, 0.45],
] as const;

function ellipsePath(rx: number, ry: number) {
  const right = SUN.x + rx;
  const left = SUN.x - rx;
  return `M ${right} ${SUN.y} A ${rx} ${ry} 0 1 1 ${left} ${SUN.y} A ${rx} ${ry} 0 1 1 ${right} ${SUN.y}`;
}

function SolarPreview() {
  const reduced = useReducedMotion();

  return (
    <svg className="scene-art" viewBox="0 0 300 160">
      <defs>
        <radialGradient id="solar-lobby-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d4" />
          <stop offset="32%" stopColor="#ffb03a" />
          <stop offset="68%" stopColor="#ff6a1a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="160" rx="12" fill="#070b14" />
      {LOBBY_STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f6f1e6" opacity={r > 0.7 ? 0.85 : 0.45} />
      ))}
      {LOBBY_PLANETS.map((planet) => (
        <ellipse
          key={planet.id}
          cx={SUN.x}
          cy={SUN.y}
          rx={planet.rx}
          ry={planet.ry}
          className="scene-orbit"
        />
      ))}
      <ellipse
        cx={SUN.x}
        cy={SUN.y}
        rx="71"
        ry="29"
        fill="none"
        stroke="rgba(196, 180, 150, 0.35)"
        strokeWidth="3.5"
        strokeDasharray="1.1 3.2"
      />
      {BELT_ROCKS.map((rock) => (
        <circle key={`${rock.x}-${rock.y}`} cx={rock.x} cy={rock.y} r={rock.r} fill={rock.fill} />
      ))}
      <circle cx={SUN.x} cy={SUN.y} r="18" fill="url(#solar-lobby-sun)" />
      <g>
        {!reduced && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${SUN.x} ${SUN.y}`}
            to={`360 ${SUN.x} ${SUN.y}`}
            dur="36s"
            repeatCount="indefinite"
          />
        )}
        <path d={`M ${SUN.x + 8} ${SUN.y - 2} Q ${SUN.x + 16} ${SUN.y - 8} ${SUN.x + 12} ${SUN.y - 14}`} stroke="#ffb15a" strokeWidth="1.2" fill="none" opacity="0.8" />
        <path d={`M ${SUN.x - 6} ${SUN.y + 5} Q ${SUN.x - 14} ${SUN.y + 12} ${SUN.x - 4} ${SUN.y + 14}`} stroke="#ff8a3a" strokeWidth="1" fill="none" opacity="0.65" />
      </g>
      <circle cx={SUN.x} cy={SUN.y} r="7" fill="#ffe7a8" />
      {LOBBY_PLANETS.map((planet) => {
        const x = SUN.x + Math.cos(planet.angle) * planet.rx;
        const y = SUN.y + Math.sin(planet.angle) * planet.ry;
        return (
          <g key={planet.id} transform={reduced ? `translate(${x} ${y})` : undefined}>
            {!reduced && (
              <animateMotion
                dur={`${planet.dur}s`}
                begin={`-${planet.offset}s`}
                repeatCount="indefinite"
                path={ellipsePath(planet.rx, planet.ry)}
              />
            )}
            {planet.rings && (
              <ellipse cx="0" cy="0" rx={planet.r * 1.9} ry={planet.r * 0.55} fill="none" stroke="rgba(232, 210, 168, 0.9)" strokeWidth="1.5" />
            )}
            <circle r={planet.r} fill={planet.color} />
            {planet.bands && (
              <>
                <path d={`M ${-planet.r * 0.72} ${-planet.r * 0.18} Q 0 ${-planet.r * 0.02} ${planet.r * 0.72} ${-planet.r * 0.22}`} stroke="#c4843a" strokeWidth={planet.r * 0.28} fill="none" strokeLinecap="round" />
                <path d={`M ${-planet.r * 0.62} ${planet.r * 0.28} Q 0 ${planet.r * 0.16} ${planet.r * 0.62} ${planet.r * 0.32}`} stroke="#f4e2c4" strokeWidth={planet.r * 0.16} fill="none" strokeLinecap="round" />
              </>
            )}
            {planet.moon && (
              <g>
                {!reduced && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                )}
                <circle cx={planet.r * 2.1} cy="0" r="1.15" fill="#d9d3c8" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const CITY_OUTER = 'M34 48 H266 Q278 48 278 56 V104 Q278 112 266 112 H34 Q22 112 22 104 V56 Q22 48 34 48 Z';
const CITY_INNER = 'M86 26 V134 Q86 146 98 146 H238 Q250 146 250 134 V26 Q250 14 238 14 H98 Q86 14 86 26 Z';
const CITY_DELIVERY = 'M24 140 V112 Q24 104 32 104 H70 Q78 104 78 96 V60 Q78 52 86 52 H160 Q168 52 168 60 V96 Q168 104 176 104 H242 Q250 104 250 112 V140 Q250 148 242 148 H32 Q24 148 24 140 Z';
const CITY_WALKERS = [
  { path: 'M22 36 H62 Q66 36 66 40 V60 Q66 64 62 64 H22 Q18 64 18 60 V40 Q18 36 22 36 Z', dur: 12, begin: -1, coat: '#2c6fbe' },
  { path: 'M100 34 H146 Q150 34 150 38 V58 Q150 62 146 62 H100 Q96 62 96 58 V38 Q96 34 100 34 Z', dur: 14, begin: -5, coat: '#e2b423' },
  { path: 'M22 120 H64 Q68 120 68 124 V146 Q68 150 64 150 H22 Q18 150 18 146 V124 Q18 120 22 120 Z', dur: 11, begin: -3, coat: '#d45d8c' },
  { path: 'M194 82 H230 Q234 82 234 86 V100 Q234 104 230 104 H194 Q190 104 190 100 V86 Q190 82 194 82 Z', dur: 9, begin: -2, coat: '#3c8f48' },
  { path: 'M108 122 H150 Q154 122 154 126 V146 Q154 150 150 150 H108 Q104 150 104 146 V126 Q104 122 108 122 Z', dur: 13, begin: -7, coat: '#6a4a8a' },
  { path: 'M186 34 H226 Q230 34 230 38 V56 Q230 60 226 60 H186 Q182 60 182 56 V38 Q182 34 186 34 Z', dur: 10, begin: -4.5, coat: '#c45c48' },
] as const;
const CITY_CARS = [
  { path: CITY_OUTER, dur: 18, begin: -0.5, color: '#4a7fd0', kind: 'car' as const },
  { path: CITY_OUTER, dur: 18, begin: -6, color: '#e15a38', kind: 'car' as const },
  { path: CITY_OUTER, dur: 18, begin: -12, color: '#f2b427', kind: 'car' as const },
  { path: CITY_INNER, dur: 20, begin: -2, color: '#2f9a55', kind: 'car' as const },
  { path: CITY_INNER, dur: 20, begin: -12, color: '#d45d8c', kind: 'bus' as const },
  { path: CITY_INNER, dur: 20, begin: -7.5, color: '#f7f4ee', kind: 'car' as const },
] as const;

function LobbyCar({ color, kind }: { color: string; kind: 'car' | 'bus' }) {
  const length = kind === 'bus' ? 14 : 9;
  const width = kind === 'bus' ? 5.2 : 4.4;
  return (
    <g>
      <rect x={-length / 2} y={-width / 2} width={length} height={width} rx="1.4" fill={color} />
      <rect
        x={kind === 'bus' ? -length * 0.28 : length * 0.05}
        y={-width * 0.28}
        width={kind === 'bus' ? length * 0.55 : length * 0.28}
        height={width * 0.56}
        rx="0.7"
        fill={kind === 'bus' ? 'rgba(214, 232, 242, 0.78)' : 'rgba(16, 22, 30, 0.55)'}
      />
    </g>
  );
}

function LobbyWalker({ coat }: { coat: string }) {
  return (
    <g>
      <ellipse cx="0.4" cy="1.6" rx="2.8" ry="1.3" fill="rgba(20, 16, 12, 0.28)" />
      <circle cx="0" cy="0.35" r="2.55" fill={coat} />
      <circle cx="0" cy="-2.1" r="1.7" fill="#f0d2b0" />
      <circle cx="-0.35" cy="-2.45" r="1.35" fill="#241c18" />
    </g>
  );
}

function CityPreview() {
  const reduced = useReducedMotion();

  return (
    <svg className="scene-art" viewBox="0 0 300 160">
      <defs>
        <radialGradient id="city-lobby-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff2f6d" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffe056" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff2f6d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="160" rx="12" fill="#cbb89a" />
      <rect x="18" y="66" width="40" height="26" rx="2" fill="#6f8f4e" />
      <circle cx="30" cy="76" r="3.2" fill="#2f7a3c" />
      <circle cx="42" cy="84" r="2.6" fill="#67b85a" />
      <circle cx="48" cy="74" r="2.2" fill="#2f7a3c" />
      <rect x="0" y="44" width="300" height="16" fill="#3a424c" />
      <rect x="0" y="100" width="300" height="16" fill="#3a424c" />
      <rect x="70" y="0" width="16" height="160" fill="#3a424c" />
      <rect x="160" y="0" width="16" height="160" fill="#3a424c" />
      <rect x="240" y="0" width="16" height="160" fill="#3a424c" />
      {[52, 108].map((y) => (
        <line key={`h-${y}`} x1="8" y1={y} x2="292" y2={y} stroke="rgba(246, 241, 230, 0.35)" strokeWidth="1.2" strokeDasharray="4 5" />
      ))}
      {[78, 168, 248].map((x) => (
        <line key={`v-${x}`} x1={x} y1="8" x2={x} y2="152" stroke="rgba(246, 241, 230, 0.35)" strokeWidth="1.2" strokeDasharray="4 5" />
      ))}
      {[
        [62, 44], [62, 100], [152, 44], [152, 100], [232, 44], [232, 100],
      ].flatMap(([x, y]) => (
        Array.from({ length: 4 }, (_, stripe) => (
          <rect
            key={`${x}-${y}-${stripe}`}
            x={x + 2}
            y={y + 2 + stripe * 3.2}
            width="12"
            height="1.5"
            fill="rgba(246, 241, 230, 0.55)"
          />
        ))
      ))}
      <rect x="18" y="14" width="40" height="22" rx="2" fill="#8c4a3a" />
      <rect x="98" y="14" width="48" height="22" rx="2" fill="#6d5544" />
      <rect x="190" y="12" width="36" height="24" rx="2" fill="#d9d0c2" />
      <rect x="98" y="68" width="48" height="24" rx="2" fill="#b03a2e" />
      <rect x="190" y="70" width="36" height="22" rx="2" fill="#f4f1ea" />
      <rect x="98" y="126" width="48" height="22" rx="2" fill="#5c6f48" />
      <rect x="198" y="126" width="28" height="14" rx="1.5" fill="#4a5260" />
      <rect x="202" y="129" width="8" height="5" rx="0.8" fill="#4a7fd0" />
      <rect x="214" y="129" width="8" height="5" rx="0.8" fill="#e15a38" />
      <circle cx="208" cy="24" r="5" fill="#f6f1e6" stroke="#2c343c" strokeWidth="1" />
      <path d="M208 20.5 V24 H211" stroke="#2c343c" strokeWidth="1" fill="none" />
      <text x="38" y="28" textAnchor="middle" fill="#f6f1e6" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">12</text>
      <text x="122" y="28" textAnchor="middle" fill="#f6f1e6" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">26</text>
      <text x="122" y="84" textAnchor="middle" fill="#f6f1e6" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">78</text>
      <text x="208" y="84" textAnchor="middle" fill="#c23b2e" fontSize="10" fontFamily="ui-sans-serif, system-ui, sans-serif">+</text>
      {[
        [70, 44], [86, 44], [160, 44], [176, 44], [240, 44], [256, 44],
        [70, 100], [86, 100], [160, 100], [176, 100],
      ].map(([x, y], index) => (
        <g key={`${x}-${y}-${index}`}>
          <rect x={x - 2} y={y - 5} width="4" height="10" rx="1" fill="#141810" />
          <circle cx={x} cy={y - 2.5} r="1.1" fill={index % 2 === 0 ? '#3dce6e' : '#ff5a4a'}>
            {!reduced && (
              <animate
                attributeName="fill"
                values={index % 2 === 0 ? '#3dce6e;#3dce6e;#ff5a4a;#ff5a4a' : '#ff5a4a;#ff5a4a;#3dce6e;#3dce6e'}
                dur="4.8s"
                begin={`${(index % 3) * -1.2}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx={x} cy={y + 2.2} r="1.1" fill={index % 2 === 0 ? '#ff5a4a' : '#3dce6e'}>
            {!reduced && (
              <animate
                attributeName="fill"
                values={index % 2 === 0 ? '#ff5a4a;#ff5a4a;#3dce6e;#3dce6e' : '#3dce6e;#3dce6e;#ff5a4a;#ff5a4a'}
                dur="4.8s"
                begin={`${(index % 3) * -1.2}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      ))}
      {CITY_CARS.map((car, index) => (
        <g key={`${car.color}-${car.begin}`} transform={reduced ? `translate(${50 + index * 28} ${48 + (index % 2) * 12}) rotate(${index % 2 ? 90 : 0})` : undefined}>
          {!reduced && (
            <animateMotion dur={`${car.dur}s`} begin={`${car.begin}s`} repeatCount="indefinite" rotate="auto" path={car.path} />
          )}
          <LobbyCar color={car.color} kind={car.kind} />
        </g>
      ))}
      <g transform={reduced ? 'translate(78 108)' : undefined}>
        {!reduced && (
          <animateMotion dur="12s" repeatCount="indefinite" rotate="auto" path={CITY_DELIVERY} />
        )}
        <circle r="13" fill="url(#city-lobby-glow)">
          {!reduced && (
            <animate attributeName="r" values="11;14;11" dur="1.6s" repeatCount="indefinite" />
          )}
        </circle>
        <rect x="-9" y="-4.5" width="18" height="9" rx="2" fill="#ff2f6d" />
        <rect x="-7" y="-3.2" width="3" height="6.4" fill="#ffe056" />
        <rect x="1" y="-3.2" width="1.6" height="6.4" fill="#ffe056" />
        <rect x="3.2" y="-2.4" width="4.2" height="4.8" rx="0.8" fill="#1a1020" />
        <path d="M-4.2 1.4 L-4.2 -0.4 L-2.6 -3.2 L-1.2 -0.7 L0 -3.8 L1.2 -0.7 L2.6 -3.2 L4.2 -0.4 L4.2 1.4 Z" fill="#ffe056" />
        <circle cx="0" cy="-0.1" r="0.85" fill="#fff8d0" />
      </g>
      {CITY_WALKERS.map((walker, index) => (
        <g key={`${walker.coat}-${walker.begin}`} transform={reduced ? `translate(${30 + index * 22} ${36 + (index % 3) * 18})` : undefined}>
          {!reduced && (
            <animateMotion dur={`${walker.dur}s`} begin={`${walker.begin}s`} repeatCount="indefinite" path={walker.path} />
          )}
          <LobbyWalker coat={walker.coat} />
        </g>
      ))}
    </svg>
  );
}

export default function ScenePreview({ id }: { id: string }) {
  if (id === 'solar-system') return <SolarPreview />;
  if (id === 'city-delivery') return <CityPreview />;
  return null;
}
