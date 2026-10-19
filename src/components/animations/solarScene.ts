import {
  drawHoleOver,
  drawHoleUnder,
  holeCues,
  holePoint,
  holeShake,
  holeShift,
  holeSunScale,
  paintDrainedSun,
  warpStar,
} from './blackHole';
import {
  drawRogueCourses,
  drawRogueOver,
  drawRogueUnder,
  paintHeavierSun,
  paintRoguePortrait,
  readClock,
  rogueBody,
  rogueShake,
  shiftBody,
} from './roguePlanet';

import type { SceneClock } from './roguePlanet';

export { holeBeat, holeFocus, HOLE_SECONDS } from './blackHole';
export type { HoleFocus } from './blackHole';
export { rogueBeat, rogueFocus, ROGUE_END_SECONDS, ROGUE_SECONDS } from './roguePlanet';
export type { RogueEnding, RogueFocus, SceneClock } from './roguePlanet';

const TAU = Math.PI * 2;
const TILT = 0.56;

type MoonLook = 'luna' | 'io' | 'europa' | 'ganymede' | 'callisto' | 'titan' | 'ice' | 'rock';

type Moon = {
  dist: number;
  radius: number;
  period: number;
  phase: number;
  color: string;
  look: MoonLook;
};

type Ring = {
  inner: number;
  outer: number;
  tilt: number;
  color: string;
};

type Planet = {
  name: string;
  orbit: number;
  radius: number;
  period: number;
  phase: number;
  color: string;
  kind: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
  ring?: Ring;
  moons: Moon[];
};

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkle: number;
  phase: number;
  layer: number;
  tint: string;
  spike: boolean;
};

type Rock = {
  orbit: number;
  size: number;
  period: number;
  phase: number;
  incline: number;
  color: string;
  spin: number;
  shape: Array<[number, number]>;
};

const PLANETS: Planet[] = [
  {
    name: 'Mercury',
    orbit: 0.15,
    radius: 5.04,
    period: 8,
    phase: 0.5,
    color: '#c8beb2',
    kind: 'mercury',
    moons: [],
  },
  {
    name: 'Venus',
    orbit: 0.23,
    radius: 6.84,
    period: 13,
    phase: 2.2,
    color: '#e6cc8c',
    kind: 'venus',
    moons: [],
  },
  {
    name: 'Earth',
    orbit: 0.32,
    radius: 7.2,
    period: 20,
    phase: 4.1,
    color: '#2c6fbe',
    kind: 'earth',
    moons: [{ dist: 7, radius: 1.5, period: 2.6, phase: 1.1, color: '#c8c2b6', look: 'luna' }],
  },
  {
    name: 'Mars',
    orbit: 0.41,
    radius: 5.76,
    period: 28,
    phase: 1.1,
    color: '#c4623a',
    kind: 'mars',
    moons: [
      { dist: 6, radius: 1.2, period: 1.2, phase: 0.3, color: '#b7aa9c', look: 'rock' },
      { dist: 8, radius: 1.15, period: 2.1, phase: 2.2, color: '#cfc3b4', look: 'rock' },
    ],
  },
  {
    name: 'Jupiter',
    orbit: 0.64,
    radius: 16.2,
    period: 48,
    phase: 1.8,
    color: '#e2c093',
    kind: 'jupiter',
    moons: [
      { dist: 6, radius: 1.5, period: 3.1, phase: 0.4, color: '#e6c04a', look: 'io' },
      { dist: 8.5, radius: 1.35, period: 4.6, phase: 1.6, color: '#f4f1ea', look: 'europa' },
      { dist: 10, radius: 1.7, period: 6.4, phase: 2.5, color: '#b7a48c', look: 'ganymede' },
      { dist: 11.5, radius: 1.5, period: 9, phase: 0.8, color: '#6d655c', look: 'callisto' },
    ],
  },
  {
    name: 'Saturn',
    orbit: 0.76,
    radius: 13.68,
    period: 72,
    phase: 3.4,
    color: '#ecd7a8',
    kind: 'saturn',
    ring: { inner: 1.22, outer: 1.65, tilt: -0.42, color: 'rgba(232, 210, 168, 0.88)' },
    moons: [
      { dist: 13, radius: 1.25, period: 3.4, phase: 0.7, color: '#f7fbff', look: 'ice' },
      { dist: 15, radius: 1.35, period: 6.2, phase: 2.1, color: '#ddd6cc', look: 'rock' },
      { dist: 16.5, radius: 1.7, period: 10, phase: 4.2, color: '#e2b56a', look: 'titan' },
    ],
  },
  {
    name: 'Uranus',
    orbit: 0.88,
    radius: 9.72,
    period: 96,
    phase: 5.2,
    color: '#a7ebe4',
    kind: 'uranus',
    ring: { inner: 1.12, outer: 1.42, tilt: 1.25, color: 'rgba(198, 236, 232, 0.55)' },
    moons: [
      { dist: 8, radius: 1.25, period: 5, phase: 1, color: '#d7e0da', look: 'ice' },
      { dist: 10, radius: 1.2, period: 7.2, phase: 2.7, color: '#c8bfb4', look: 'rock' },
    ],
  },
  {
    name: 'Neptune',
    orbit: 0.98,
    radius: 9.36,
    period: 124,
    phase: 2.5,
    color: '#3a5ed0',
    kind: 'neptune',
    moons: [{ dist: 8, radius: 1.35, period: 5.6, phase: 0.4, color: '#d5e6ee', look: 'ice' }],
  },
];

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(): Star[] {
  const next = random(11);
  const tints = ['246, 241, 230', '190, 210, 255', '255, 214, 176'];
  return Array.from({ length: 460 }, () => {
    const layerRoll = next();
    const layer = layerRoll < 0.62 ? 0 : layerRoll < 0.9 ? 1 : 2;
    const radius = layer === 2 ? 1.15 + next() * 0.7 : 0.4 + next() * (layer === 1 ? 0.9 : 0.55);
    return {
      x: next(),
      y: next(),
      r: radius,
      alpha: 0.28 + next() * 0.72,
      twinkle: 0.4 + next() * 2.2,
      phase: next() * TAU,
      layer,
      tint: tints[Math.floor(next() * tints.length)],
      spike: layer === 2 && next() > 0.72,
    };
  });
}

function buildRocks(): Rock[] {
  const next = random(29);
  const colors = ['#8d8478', '#6a6258', '#b1a28e', '#514c46', '#9a8b74', '#7a5a48', '#c4b49a'];
  return Array.from({ length: 460 }, () => {
    const sides = 5 + Math.floor(next() * 3);
    const shape = Array.from({ length: sides }, (_, index) => {
      const angle = (index / sides) * TAU + (next() - 0.5) * 0.55;
      const distance = 0.62 + next() * 0.55;
      return [Math.cos(angle) * distance, Math.sin(angle) * distance] as [number, number];
    });
    const large = next() > 0.94;
    return {
      orbit: 0.47 + next() * 0.095,
      size: large ? 2.6 + next() * 1.4 : 0.7 + next() * 1.25,
      period: 32 + next() * 16,
      phase: next() * TAU,
      incline: (next() - 0.5) * 18,
      color: colors[Math.floor(next() * colors.length)],
      spin: next() * TAU,
      shape,
    };
  });
}

const STARS = buildStars();
const ROCKS = buildRocks();

type Trojan = Rock & { lead: boolean; spread: number; radial: number };

function buildTrojans(): Trojan[] {
  const next = random(73);
  const colors = ['#8d8070', '#6a6156', '#b09a7c', '#514c46', '#c4b49a'];
  return Array.from({ length: 52 }, (_, index) => {
    const sides = 5 + Math.floor(next() * 3);
    const shape = Array.from({ length: sides }, (_, side) => {
      const angle = (side / sides) * TAU + (next() - 0.5) * 0.5;
      const distance = 0.65 + next() * 0.5;
      return [Math.cos(angle) * distance, Math.sin(angle) * distance] as [number, number];
    });
    return {
      lead: index < 26,
      spread: (next() - 0.5) * 0.46,
      radial: (next() - 0.5) * 0.028,
      orbit: 0,
      size: 0.9 + next() * 1.2,
      period: 1,
      phase: next() * TAU,
      incline: (next() - 0.5) * 10,
      color: colors[Math.floor(next() * colors.length)],
      spin: next() * TAU,
      shape,
    };
  });
}

const TROJANS = buildTrojans();
const CERES = { orbit: 0.515, period: 36, phase: 2.1 };

function ceresAngle(time: number) {
  return (time / CERES.period) * TAU + CERES.phase;
}

function drawCeres(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number,
  sunX: number,
  sunY: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(time * 0.12);
  const ground = ctx.createRadialGradient(-radius * 0.25, -radius * 0.2, radius * 0.1, 0, 0, radius);
  ground.addColorStop(0, '#d2c4b2');
  ground.addColorStop(0.55, '#a89886');
  ground.addColorStop(1, '#6d6256');
  ctx.fillStyle = ground;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.fillStyle = 'rgba(58, 50, 42, 0.4)';
  [[-0.22, 0.08, 0.26], [0.28, -0.16, 0.16], [-0.05, -0.32, 0.12]].forEach(([px, py, size]) => {
    ctx.beginPath();
    ctx.arc(px * radius, py * radius, size * radius, 0, TAU);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(246, 244, 236, 0.92)';
  ctx.beginPath();
  ctx.arc(radius * 0.08, radius * 0.2, radius * 0.14, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.22, radius * 0.12, radius * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  shade(ctx, x, y, radius, sunX, sunY);
  ctx.restore();
}

function sceneMetrics(width: number, height: number) {
  const tiltReach = ((height / 2) - 2) / TILT;
  const reach = Math.max(120, Math.min((width / 2) - 2, tiltReach));
  return {
    reach,
    cx: width / 2,
    cy: height / 2,
    scale: reach / 500,
    sunRadius: Math.min(68, Math.max(20, reach * 0.07)),
  };
}

export type PlanetKind = Planet['kind'];

export type PlanetHit = {
  kind: PlanetKind;
  name: string;
  x: number;
  y: number;
  body: number;
  edge: number;
  radius: number;
  gone: boolean;
};

export const PLANET_BUTTONS = PLANETS.map((planet) => ({
  kind: planet.kind,
  name: planet.name,
}));

export type SceneKind = PlanetKind | 'sun' | 'belt' | 'rogue';

export function sunDisk(width: number, height: number, epoch: number | SceneClock = 0) {
  const { cx, cy, sunPx, clock } = placeBodies(width, height, 0, epoch);
  const body = sunPx * (clock.hole > 0 ? holeSunScale(clock.hole) : 1);
  return { x: cx, y: cy, body };
}

export function pointInBelt(width: number, height: number, x: number, y: number, epoch: number | SceneClock = 0) {
  const { reach, cx, cy, fate } = placeBodies(width, height, 0, epoch);
  if (fate.shatter > 0.82) return false;
  const span = reach * fate.view;
  const norm = Math.hypot((x - cx) / span, (y - cy) / (span * TILT));
  return norm >= 0.445 && norm <= 0.59;
}

export function beltEdges(width: number, height: number, epoch: number | SceneClock = 0) {
  const { reach, cx, cy, fate } = placeBodies(width, height, 0, epoch);
  return { cx, cy, inner: reach * 0.47 * fate.view, outer: reach * 0.56 * fate.view, tilt: TILT };
}

export function planetHits(width: number, height: number, time: number, epoch: number | SceneClock = 0): PlanetHit[] {
  return placeBodies(width, height, time, epoch).bodies.map((body) => {
    const edge = body.planet.ring ? body.radius * body.planet.ring.outer * body.look.ring : body.radius;
    return {
      kind: body.planet.kind,
      name: body.planet.name,
      x: body.x,
      y: body.y,
      body: body.radius,
      edge,
      radius: body.gone ? 0 : Math.max(body.radius + 6, 14),
      gone: body.gone,
    };
  });
}

const PORTRAIT_SPIN: Record<PlanetKind, number> = {
  mercury: 0.28,
  venus: -0.06,
  earth: 0.18,
  mars: 0.16,
  jupiter: 0.42,
  saturn: 0.36,
  uranus: 0.14,
  neptune: 0.16,
};

function paintPortraitSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  seedName: string,
) {
  const x = width / 2;
  const y = height * 0.5;
  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createRadialGradient(x, y, 20, x, y, Math.max(width, height) * 0.72);
  sky.addColorStop(0, '#121a2e');
  sky.addColorStop(1, '#05070f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 48; index += 1) {
    const seed = index * 97 + seedName.length * 13;
    const sx = ((seed * 53) % 1000) / 1000 * width;
    const sy = ((seed * 29) % 1000) / 1000 * height;
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.4 + index));
    ctx.fillStyle = `rgba(236, 228, 214, ${0.35 * twinkle})`;
    ctx.beginPath();
    ctx.arc(sx, sy, index % 9 === 0 ? 1.3 : 0.7, 0, TAU);
    ctx.fill();
  }
}

function paintBeltPortrait(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, epoch: number | SceneClock = 0) {
  paintPortraitSky(ctx, width, height, time, 'belt');
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.min(width, height) * 0.35;
  const tilt = 0.72;
  const clock = readClock(epoch);
  const holeBroken = clock.hole <= 0 ? 0 : clock.hole >= 0.88 ? 1 : Math.max(0, (clock.hole - 0.32) / 0.28);
  const broken = Math.max(sunFate(clock.sun).shatter, clock.rogue > 0.5 ? 0.35 : 0, holeBroken);
  ctx.beginPath();
  ctx.ellipse(cx, cy, reach, reach * tilt, 0, 0, TAU);
  ctx.ellipse(cx, cy, reach * 0.62, reach * 0.62 * tilt, 0, 0, TAU);
  ctx.fillStyle = `rgba(186, 164, 128, ${0.1 * (1 - broken * 0.82)})`;
  ctx.fill('evenodd');

  const ceresSpin = time * 0.22 + CERES.phase + broken * 0.8;
  const ceresOrbit = reach * 0.8 * (1 + broken * 0.28);
  const ceres = {
    angle: ceresSpin,
    x: cx + Math.cos(ceresSpin) * ceresOrbit,
    y: cy + Math.sin(ceresSpin) * ceresOrbit * tilt,
    radius: Math.max(14, reach * 0.2),
  };
  const placed = ROCKS.filter((_, index) => index % 2 === 0).map((rock) => {
    const angle = time * 0.35 + rock.phase;
    const span = (rock.orbit - 0.47) / 0.095;
    const slip = (Math.sin(rock.phase * 9.1) + 1) / 2;
    const orbit = reach * (0.62 + span * 0.38) * (1 + broken * (slip - 0.35) * 1.15);
    return {
      rock,
      angle,
      alpha: 1 - broken * (slip > 0.45 ? 0.85 : 0.4),
      size: 1 - broken * 0.45,
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit * tilt + Math.sin(angle * 2 + rock.phase) * rock.incline * 0.35,
    };
  }).filter((rock) => Math.hypot(rock.x - ceres.x, rock.y - ceres.y) > ceres.radius * (1 - broken * 0.4) + 4);

  const draw = (front: boolean) => {
    placed.forEach((rock) => {
      if ((Math.sin(rock.angle) >= 0) !== front) return;
      ctx.save();
      ctx.globalAlpha = rock.alpha;
      ctx.translate(rock.x, rock.y);
      ctx.rotate(rock.rock.spin + time * 0.55 * (1 + broken * 4));
      ctx.fillStyle = rock.rock.color;
      const size = Math.max(2, rock.rock.size * 3.3 * rock.size);
      ctx.beginPath();
      rock.rock.shape.forEach(([px, py], index) => {
        if (index === 0) ctx.moveTo(px * size, py * size);
        else ctx.lineTo(px * size, py * size);
      });
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 232, 204, 0.4)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    });
  };
  const ceresFront = Math.sin(ceres.angle) >= 0;
  const ceresRadius = ceres.radius * (1 - broken * 0.35);
  draw(false);
  if (!ceresFront) {
    ctx.save();
    ctx.globalAlpha = 1 - broken * 0.45;
    drawCeres(ctx, ceres.x, ceres.y, ceresRadius, time, cx - reach, cy - reach * 0.4);
    ctx.restore();
  }
  draw(true);
  if (ceresFront) {
    ctx.save();
    ctx.globalAlpha = 1 - broken * 0.45;
    drawCeres(ctx, ceres.x, ceres.y, ceresRadius, time, cx - reach, cy - reach * 0.4);
    ctx.restore();
  }
  ctx.font = '500 13px Figtree, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(236, 228, 214, 0.9)';
  const ceresLabel = 'Ceres';
  const ceresLabelWidth = ctx.measureText(ceresLabel).width;
  const ceresLabelX = ceres.x + ceres.radius + 6 + ceresLabelWidth > width - 8
    ? ceres.x - ceres.radius - 8 - ceresLabelWidth
    : ceres.x + ceres.radius + 6;
  ctx.fillText(ceresLabel, ceresLabelX, ceres.y);
}

export function paintCloseup(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: SceneKind,
  time: number,
  epoch: number | SceneClock = 0,
) {
  if (kind === 'rogue') {
    paintRoguePortrait(ctx, width, height, time);
    return;
  }
  if (kind === 'sun') {
    paintSunPortrait(ctx, width, height, time, epoch);
    return;
  }
  if (kind === 'belt') {
    paintBeltPortrait(ctx, width, height, time, epoch);
    return;
  }
  paintPlanetPortrait(ctx, width, height, kind, time, epoch);
}

export function paintPlanetPortrait(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: PlanetKind,
  time: number,
  epoch: number | SceneClock = 0,
) {
  const planet = PLANETS.find((entry) => entry.kind === kind);
  if (!planet) return;
  const clock = readClock(epoch);
  const fate = sunFate(clock.sun);
  const rogueFrost = clock.ending === 'eject' && kind === 'earth' ? clock.choice : 0;
  const rogueScorch = clock.ending === 'star' && kind === 'earth' ? Math.max(0, clock.choice - 0.3) / 0.7 : 0;
  const showMoon = !(kind === 'earth' && clock.ending === 'eject' && clock.choice > 0.35);
  const drained = clock.hole > 0.85;
  const rocky = drained && (kind === 'jupiter' || kind === 'saturn');
  const x = width / 2;
  const y = height * 0.5;
  const bulk = kind === 'jupiter' ? 1 + fate.bloat * 0.45 : kind === 'uranus' ? 1 + fate.swell * 0.4 : 1;
  const radius = Math.min(width, height) * bulk * (rocky ? 0.42 : 1) * (
    kind === 'earth' ? 0.23
      : kind === 'jupiter' ? 0.21
        : kind === 'saturn' ? 0.26
          : kind === 'uranus' ? 0.2
            : kind === 'neptune' ? 0.28
              : 0.34
  );

  paintPortraitSky(ctx, width, height, time, kind);
  const keepCraft = clock.sun === 0 && clock.rogue === 0 && clock.hole === 0;
  const hideMoons = ((kind === 'jupiter' || kind === 'saturn' || kind === 'neptune' || kind === 'uranus') && clock.rogue > 0.55) || (drained && kind !== 'earth');
  if (kind === 'earth' && showMoon) drawEarthCompanions(ctx, x, y, radius, time, 'orbits', keepCraft);
  if (hasPortraitMoons(kind) && !hideMoons) drawPortraitMoons(ctx, kind, x, y, radius, time, 'orbits');
  if (kind === 'earth' && showMoon) drawEarthCompanions(ctx, x, y, radius, time, 'back', keepCraft);
  if (hasPortraitMoons(kind) && !hideMoons) drawPortraitMoons(ctx, kind, x, y, radius, time, 'back');

  const scorched = fate.scorch > 0.4 && (kind === 'earth' || kind === 'mars');
  if (!scorched) {
    const glow = ctx.createRadialGradient(x, y, radius * 0.92, x, y, radius * 1.2);
    glow.addColorStop(0, 'rgba(255, 244, 220, 0.08)');
    glow.addColorStop(1, 'rgba(255, 244, 220, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.45, 0, TAU);
    ctx.fill();
  }

  const showRings = planet.ring && !(kind === 'saturn' && (fate.rings < 0.2 || rocky));
  if (showRings && planet.ring) {
    ctx.save();
    ctx.globalAlpha = kind === 'saturn' ? fate.rings : 1;
    ctx.translate(x, y);
    drawRing(ctx, radius, planet.ring, false);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  ctx.translate(x, y);
  drawSurface(ctx, planet, radius, time);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  shade(ctx, x, y, radius, x - radius * 2.4, y - radius * 1.5);
  ctx.restore();
  if (scorched) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = kind === 'earth' ? 'rgb(168, 54, 24)' : 'rgb(140, 48, 22)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = kind === 'earth' ? 'rgba(62, 18, 8, 0.55)' : 'rgba(54, 16, 8, 0.42)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (fate.winter > 0.4) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = `rgba(186, 214, 255, ${fate.winter * (scorched ? 0.16 : 0.4)})`;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (rogueScorch > 0.15) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(168, 64, 28)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (rocky) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(110, 68, 46)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (drained && (kind === 'mars' || kind === 'neptune' || kind === 'uranus' || kind === 'mercury' || kind === 'venus')) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(186, 214, 255, 0.42)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (rogueFrost > 0.15) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = `rgba(186, 220, 255, ${rogueFrost * 0.55})`;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (!(fate.scorch > 0.45 && (kind === 'earth' || kind === 'mars')) && rogueScorch < 0.45 && !rocky) {
    drawAtmosphere(ctx, x, y, radius, planet.kind);
  }

  if (showRings && planet.ring) {
    ctx.save();
    ctx.globalAlpha = kind === 'saturn' ? fate.rings : 1;
    ctx.translate(x, y);
    drawRing(ctx, radius, planet.ring, true);
    ctx.restore();
  }
  if (kind === 'earth' && showMoon) drawEarthCompanions(ctx, x, y, radius, time, 'front', keepCraft);
  if (hasPortraitMoons(kind) && !hideMoons) drawPortraitMoons(ctx, kind, x, y, radius, time, 'front');
}

type PortraitPass = 'orbits' | 'back' | 'front';

type PortraitOrbit = {
  rx: number;
  ry: number;
  speed: number;
  phase: number;
  tilt: number;
};

function orbitPoint(cx: number, cy: number, orbit: PortraitOrbit, time: number) {
  const angle = time * orbit.speed + orbit.phase;
  const localX = Math.cos(angle) * orbit.rx;
  const localY = Math.sin(angle) * orbit.ry;
  const cos = Math.cos(orbit.tilt);
  const sin = Math.sin(orbit.tilt);
  return {
    x: cx + localX * cos - localY * sin,
    y: cy + localX * sin + localY * cos,
  };
}

function strokeOrbit(ctx: CanvasRenderingContext2D, cx: number, cy: number, orbit: PortraitOrbit) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(orbit.tilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, TAU);
  ctx.strokeStyle = 'rgba(236, 228, 214, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawSatellite(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#9eb6cc';
  ctx.fillRect(-12, -0.6, 7, 1.2);
  ctx.fillRect(5, -0.6, 7, 1.2);
  ctx.fillStyle = '#e7eef4';
  ctx.fillRect(-4.2, -1.4, 8.4, 2.8);
  ctx.fillStyle = '#f6f1e6';
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawEarthCompanions(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  pass: PortraitPass,
  showSatellites: boolean,
) {
  const moonOrbit: PortraitOrbit = { rx: radius * 2.05, ry: radius * 0.72, speed: 0.15, phase: 0.8, tilt: -0.22 };
  const satellites: PortraitOrbit[] = [
    { rx: radius * 1.38, ry: radius * 0.5, speed: 0.68, phase: 0.3, tilt: 0.58 },
    { rx: radius * 1.56, ry: radius * 0.44, speed: 0.92, phase: 2.2, tilt: -0.42 },
    { rx: radius * 1.76, ry: radius * 0.58, speed: 0.54, phase: 4.0, tilt: 0.14 },
  ];
  if (pass === 'orbits') {
    strokeOrbit(ctx, cx, cy, moonOrbit);
    if (showSatellites) satellites.forEach((orbit) => strokeOrbit(ctx, cx, cy, orbit));
    return;
  }
  const moon = orbitPoint(cx, cy, moonOrbit, time);
  if ((pass === 'front') === (moon.y >= cy)) {
    drawMoon(ctx, {
      dist: 0,
      radius: 1,
      period: 1,
      phase: 0,
      color: '#c8c2b6',
      look: 'luna',
    }, moon.x, moon.y, radius * 0.36, cx - radius * 2.4, cy - radius * 1.5, time);
  }
  if (!showSatellites) return;
  satellites.forEach((orbit) => {
    const point = orbitPoint(cx, cy, orbit, time);
    if ((pass === 'front') !== (point.y >= cy)) return;
    drawSatellite(ctx, point.x, point.y, time * orbit.speed + orbit.phase);
  });
}

function hasPortraitMoons(kind: PlanetKind) {
  return kind === 'mars' || kind === 'jupiter' || kind === 'saturn' || kind === 'uranus' || kind === 'neptune';
}

function drawPortraitMoons(
  ctx: CanvasRenderingContext2D,
  kind: PlanetKind,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  pass: PortraitPass,
) {
  const moons = PLANETS.find((planet) => planet.kind === kind)?.moons ?? [];
  const ringTilt = kind === 'saturn' ? -0.42 : kind === 'uranus' ? 1.25 : 0;
  const flat = kind === 'saturn' || kind === 'uranus' ? 0.32 : 1;
  const layout: Array<PortraitOrbit & { moon: Moon; size: number }> = kind === 'mars'
    ? [
      { rx: radius * 1.48, ry: radius * 0.58, speed: 1.15, phase: 0.4, tilt: 0.2, size: 0.09, moon: moons[0] },
      { rx: radius * 2.12, ry: radius * 0.7, speed: 0.34, phase: 2.5, tilt: -0.14, size: 0.06, moon: moons[1] },
    ]
    : kind === 'jupiter'
    ? [
      { rx: radius * 1.58, ry: radius * 0.5, speed: 0.78, phase: 0.4, tilt: 0.06, size: 0.16, moon: moons[0] },
      { rx: radius * 1.95, ry: radius * 0.46, speed: 0.52, phase: 1.7, tilt: -0.1, size: 0.14, moon: moons[1] },
      { rx: radius * 2.32, ry: radius * 0.42, speed: 0.34, phase: 3.1, tilt: 0.16, size: 0.2, moon: moons[2] },
    ]
    : kind === 'saturn'
      ? [
        { rx: radius * 1.92, ry: radius * 1.92 * flat, speed: 0.62, phase: 0.7, tilt: ringTilt, size: 0.1, moon: moons[0] },
        { rx: radius * 2.2, ry: radius * 2.2 * flat, speed: 0.4, phase: 2.1, tilt: ringTilt, size: 0.11, moon: moons[1] },
        { rx: radius * 2.55, ry: radius * 2.55 * flat, speed: 0.26, phase: 4.2, tilt: ringTilt, size: 0.2, moon: moons[2] },
      ]
      : kind === 'uranus'
        ? [
          { rx: radius * 1.75, ry: radius * 1.75 * flat, speed: 0.48, phase: 1, tilt: ringTilt, size: 0.14, moon: moons[0] },
          { rx: radius * 2.15, ry: radius * 2.15 * flat, speed: 0.32, phase: 2.7, tilt: ringTilt, size: 0.13, moon: moons[1] },
        ]
        : [
          { rx: radius * 1.85, ry: radius * 0.62, speed: -0.38, phase: 0.4, tilt: 0.35, size: 0.16, moon: moons[0] },
        ];
  if (pass === 'orbits') {
    layout.forEach((orbit) => strokeOrbit(ctx, cx, cy, orbit));
    return;
  }
  layout.forEach((orbit) => {
    if (!orbit.moon) return;
    const point = orbitPoint(cx, cy, orbit, time);
    if ((pass === 'front') !== (point.y >= cy)) return;
    drawMoon(ctx, orbit.moon, point.x, point.y, radius * orbit.size, cx - radius * 2.4, cy - radius * 1.5, time);
  });
}

function paintSunPortrait(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, epoch: number | SceneClock = 0) {
  const clock = readClock(epoch);
  if (clock.hole > 0.85) {
    paintDrainedSun(ctx, width, height);
    return;
  }
  const fate = sunFate(clock.sun);
  paintPortraitSky(ctx, width, height, time, fate.dwarf > 0.5 ? 'dwarf' : 'sun');
  const x = width / 2;
  const y = height / 2;
  if (fate.dwarf > 0.5) {
    ctx.fillStyle = 'rgba(4, 10, 24, 0.5)';
    ctx.fillRect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.11;
    const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 3.2);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    glow.addColorStop(0.35, 'rgba(214, 228, 255, 0.55)');
    glow.addColorStop(1, 'rgba(120, 150, 210, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.2, 0, TAU);
    ctx.fill();
    const body = ctx.createRadialGradient(x, y, 0, x, y, radius);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.55, '#e7eefc');
    body.addColorStop(1, '#b9c8ee');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    return;
  }
  const giant = fate.giant > 0.35;
  const radius = Math.min(width, height) * (giant ? 0.4 : 0.29);
  drawSun(ctx, x, y, radius, time, giant ? 1.12 : 3.6, giant ? 0.22 : 1);
  if (giant) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(170, 24, 0, 0.4)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }
  drawSolarActivity(ctx, x, y, radius, time);
  if (clock.ending === 'star' && clock.choice > 0.4) paintHeavierSun(ctx, width, height);
}

function drawSolarActivity(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
) {
  const arch = (
    angle: number,
    span: number,
    height: number,
    lean: number,
  ) => {
    const steps = 18;
    const points: Array<[number, number]> = [];
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const along = angle - span + span * 2 * t;
      const lift = Math.sin(Math.PI * t) ** 0.9 * height;
      const skew = Math.sin(Math.PI * t) * lean;
      const reach = radius + lift;
      points.push([Math.cos(along + skew) * reach, Math.sin(along + skew) * reach]);
    }
    return points;
  };
  const strokeArch = (points: Array<[number, number]>, width: number, color: string) => {
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let index = 0; index < 40; index += 1) {
    const seed = hash2(index, 4);
    const angle = (index / 40) * TAU;
    const flicker = 0.75 + 0.25 * Math.sin(time * 2.4 + index);
    const length = radius * (0.012 + seed * 0.028) * flicker;
    ctx.strokeStyle = `rgba(255, ${Math.round(150 + seed * 80)}, 50, ${0.12 + seed * 0.16})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.lineTo(Math.cos(angle) * (radius + length), Math.sin(angle) * (radius + length));
    ctx.stroke();
  }

  [
    { angle: 1.15, span: 0.22, reach: 0.38, lean: 0.12, phase: 0.3 },
    { angle: 2.7, span: 0.11, reach: 0.16, lean: -0.05, phase: 1.6 },
    { angle: 4.55, span: 0.18, reach: 0.26, lean: 0.08, phase: 2.5 },
  ].forEach((loop) => {
    const breathe = 0.72 + 0.28 * Math.sin(time * 0.45 + loop.phase);
    const height = radius * loop.reach * breathe;
    const points = arch(loop.angle, loop.span, height, loop.lean);
    strokeArch(points, 3.4 + breathe, `rgba(210, 42, 12, ${0.22 + breathe * 0.18})`);
    strokeArch(points, 1.15, `rgba(255, 236, 196, ${0.45 + breathe * 0.35})`);
  });

  const erupt = 0.5 + 0.5 * Math.sin(time * 0.33);
  const eruptHeight = radius * (0.16 + erupt * 0.55);
  const eruptArch = arch(4.35, 0.13, eruptHeight, 0.1);
  strokeArch(eruptArch, 4, `rgba(255, 64, 16, ${0.15 + erupt * 0.2})`);
  strokeArch(eruptArch, 1.2, `rgba(255, 244, 220, ${0.3 + erupt * 0.45})`);
  if (erupt > 0.62) {
    const tip = eruptArch[9];
    const spray = (erupt - 0.62) / 0.38;
    for (let index = 0; index < 7; index += 1) {
      const spread = (index - 3) * 0.07;
      const angle = Math.atan2(tip[1], tip[0]) + spread;
      const length = radius * 0.16 * spray * (1 - Math.abs(spread));
      ctx.strokeStyle = `rgba(255, 180, 80, ${0.35 * spray})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(tip[0] + Math.cos(angle) * length, tip[1] + Math.sin(angle) * length);
      ctx.stroke();
    }
  }

  const flareAngle = -1.05;
  const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 1.15));
  const footX = Math.cos(flareAngle) * radius * 0.97;
  const footY = Math.sin(flareAngle) * radius * 0.97;
  const glow = ctx.createRadialGradient(footX, footY, 0, footX, footY, radius * 0.16);
  glow.addColorStop(0, `rgba(255, 255, 236, ${0.7 * pulse})`);
  glow.addColorStop(0.45, `rgba(255, 170, 50, ${0.35 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 80, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(footX, footY, radius * 0.16, 0, TAU);
  ctx.fill();
  for (let index = -4; index <= 4; index += 1) {
    const angle = flareAngle + index * 0.055;
    const length = radius * (0.12 + pulse * 0.28) * (1 - Math.abs(index) * 0.1);
    ctx.strokeStyle = `rgba(255, ${210 - Math.abs(index) * 18}, 90, ${0.16 * pulse * (1 - Math.abs(index) * 0.12)})`;
    ctx.lineWidth = Math.max(0.6, 2.1 - Math.abs(index) * 0.28);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.lineTo(Math.cos(angle) * (radius + length), Math.sin(angle) * (radius + length));
    ctx.stroke();
  }

  [0.4, 3.15].forEach((base, stream) => {
    for (let index = 0; index < 8; index += 1) {
      const life = (time * 0.2 + index / 8 + stream * 0.31) % 1;
      const angle = base + (hash2(index, stream + 11) - 0.5) * 0.55;
      const dist = radius * (1.15 + life * 1.35);
      const length = radius * (0.06 + life * 0.14);
      ctx.strokeStyle = `rgba(255, 186, 90, ${Math.sin(life * Math.PI) * 0.4})`;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
      ctx.lineTo(Math.cos(angle) * (dist + length), Math.sin(angle) * (dist + length));
      ctx.stroke();
    }
  });

  ctx.restore();
}

function place(cx: number, cy: number, angle: number, radius: number, tilt = TILT) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius * tilt,
  };
}

function shade(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sunX: number, sunY: number) {
  const dx = sunX - x;
  const dy = sunY - y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const light = ctx.createLinearGradient(x - ux * radius, y - uy * radius, x + ux * radius, y + uy * radius);
  light.addColorStop(0, 'rgba(2, 6, 16, 0.82)');
  light.addColorStop(0.34, 'rgba(2, 6, 16, 0.16)');
  light.addColorStop(0.62, 'rgba(2, 6, 16, 0)');
  light.addColorStop(1, 'rgba(255, 236, 206, 0.07)');
  ctx.fillStyle = light;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

const LUNAR_MARIA: Array<[number, number, number, number]> = [
  [0.22, 0.5, 0.15, 0.2],
  [0.34, 0.34, 0.08, 0.055],
  [0.43, 0.3, 0.05, 0.04],
  [0.5, 0.43, 0.06, 0.045],
  [0.66, 0.36, 0.04, 0.052],
  [0.38, 0.6, 0.09, 0.045],
  [0.27, 0.66, 0.05, 0.032],
  [0.55, 0.56, 0.032, 0.026],
];

const LUNAR_CRATERS = (() => {
  const next = random(29);
  const scattered = Array.from({ length: 46 }, () => {
    const big = next() > 0.72;
    return {
      lon: 0.14 + next() * 0.72,
      lat: 0.08 + next() * 0.84,
      radius: big ? 0.05 + next() * 0.035 : 0.02 + next() * 0.018,
      depth: big ? 34 + next() * 26 : 16 + next() * 16,
    };
  });
  return scattered.concat([
    { lon: 0.4, lat: 0.46, radius: 0.09, depth: 52 },
    { lon: 0.48, lat: 0.72, radius: 0.072, depth: 46 },
    { lon: 0.62, lat: 0.38, radius: 0.058, depth: 36 },
    { lon: 0.28, lat: 0.42, radius: 0.064, depth: 32 },
    { lon: 0.52, lat: 0.28, radius: 0.05, depth: 30 },
  ]);
})();

let moonMap: HTMLCanvasElement | null = null;

function buildMoonMap() {
  return fillMap(512, 256, (lon, lat) => {
    const grain = fbmSphere(lon, lat, 3.4);
    const fine = fbmSphere(lon + 1.8, lat, 7.5);
    let shade = (grain - 0.48) * 34 + (fine - 0.5) * 18;
    let sea = 0;
    LUNAR_MARIA.forEach(([centerLon, centerLat, rx, ry]) => {
      const distance = stampOval(lon, lat, centerLon, centerLat, rx, ry);
      if (distance < 1) sea = Math.max(sea, (1 - distance) ** 0.55);
    });
    LUNAR_CRATERS.forEach((crater) => {
      let dx = lon - crater.lon;
      if (dx > 0.5) dx -= 1;
      if (dx < -0.5) dx += 1;
      const distance = Math.hypot(dx, lat - crater.lat) / crater.radius;
      if (distance < 0.55) shade -= (1 - distance / 0.55) * crater.depth;
      else if (distance < 1.05) shade += (1 - Math.abs(distance - 0.8) / 0.25) * crater.depth * 0.85;
    });
    [
      [0.48, 0.72, 0.52, 4],
      [0.4, 0.46, 0.28, 5],
    ].forEach(([originLon, originLat, reach, arms]) => {
      let dx = lon - originLon;
      if (dx > 0.5) dx -= 1;
      if (dx < -0.5) dx += 1;
      const dy = lat - originLat;
      const rayDistance = Math.hypot(dx, dy);
      const spoke = Math.abs(Math.cos(Math.atan2(dy, dx) * arms)) ** 8;
      if (rayDistance > 0.025 && rayDistance < reach) {
        shade += (1 - rayDistance / reach) * spoke * 78;
      }
    });
    const highland = [198, 190, 176];
    const maria = [72, 68, 64];
    const mix = sea * 0.86;
    const clamp = (value: number) => Math.max(0, Math.min(255, value));
    return [
      clamp(lerp(highland[0], maria[0], mix) + shade),
      clamp(lerp(highland[1], maria[1], mix) + shade),
      clamp(lerp(highland[2], maria[2], mix) + shade * 0.9),
      255,
    ];
  });
}

function drawMoonSurface(ctx: CanvasRenderingContext2D, moon: Moon, radius: number) {
  ctx.fillStyle = moon.color;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  if (moon.look === 'io') {
    ctx.fillStyle = '#c44820';
    ctx.beginPath();
    ctx.arc(radius * 0.1, radius * 0.05, radius * 0.28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f2e27a';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.18, 0, TAU);
    ctx.fill();
  } else if (moon.look === 'europa') {
    ctx.strokeStyle = 'rgba(150, 170, 190, 0.7)';
    ctx.lineWidth = Math.max(0.4, radius * 0.08);
    ctx.beginPath();
    ctx.moveTo(-radius, radius * 0.1);
    ctx.lineTo(radius * 0.2, -radius * 0.05);
    ctx.lineTo(radius, radius * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, -radius);
    ctx.lineTo(radius * 0.05, radius);
    ctx.stroke();
  } else if (moon.look === 'ganymede') {
    ctx.fillStyle = '#8c7c68';
    ctx.fillRect(-radius, -radius * 0.15, radius * 2, radius * 0.35);
    ctx.fillStyle = '#d9cbb6';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.25, radius * 0.22, 0, TAU);
    ctx.fill();
  } else if (moon.look === 'callisto') {
    ctx.fillStyle = 'rgba(30, 26, 22, 0.35)';
    [[-0.2, 0.1, 0.22], [0.25, -0.15, 0.16], [0.05, 0.3, 0.12]].forEach(([x, y, size]) => {
      ctx.beginPath();
      ctx.arc(x * radius, y * radius, size * radius, 0, TAU);
      ctx.fill();
    });
  } else if (moon.look === 'titan') {
    const haze = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    haze.addColorStop(0, '#f0c27a');
    haze.addColorStop(1, '#c4843a');
    ctx.fillStyle = haze;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  } else if (moon.look === 'ice') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(-radius * 0.15, -radius * 0.1, radius * 0.28, 0, TAU);
    ctx.fill();
  }
  if (moon.look === 'rock' || moon.look === 'callisto') {
    ctx.fillStyle = 'rgba(255, 248, 236, 0.28)';
    ctx.beginPath();
    ctx.arc(radius * 0.32, radius * 0.22, radius * 0.12, 0, TAU);
    ctx.fill();
  }
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  moon: Moon,
  x: number,
  y: number,
  radius: number,
  sunX: number,
  sunY: number,
  time = 0,
) {
  if (moon.look === 'titan') {
    ctx.beginPath();
    ctx.arc(x, y, radius + 2.2, 0, TAU);
    ctx.fillStyle = 'rgba(226, 164, 70, 0.28)';
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  ctx.translate(x, y);
  if (moon.look === 'luna') {
    moonMap ??= buildMoonMap();
    const spin = Math.sin(time * 0.15) * 0.012;
    ctx.drawImage(projected('luna', moonMap, radius, spin), -radius, -radius, radius * 2, radius * 2);
  } else {
    drawMoonSurface(ctx, moon, radius);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  shade(ctx, x, y, radius, sunX, sunY);
  ctx.restore();
}

function hash2(ix: number, iy: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return value;
}

function fbmSphere(lon: number, lat: number, scale: number) {
  const angle = lon * TAU;
  const x = Math.cos(angle) * scale;
  const z = Math.sin(angle) * scale;
  const y = (lat - 0.5) * scale * 2;
  return fbm(x + 3.2, z + 1.7) * 0.62 + fbm(x * 2 + y, z * 2 - y) * 0.38;
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function mixColor(
  amount: number,
  stops: Array<[number, number, number, number]>,
) {
  const t = Math.max(0, Math.min(1, amount));
  let index = 0;
  while (index < stops.length - 2 && t > stops[index + 1][0]) index += 1;
  const left = stops[index];
  const right = stops[index + 1];
  const span = right[0] - left[0] || 1;
  const local = (t - left[0]) / span;
  return [
    lerp(left[1], right[1], local),
    lerp(left[2], right[2], local),
    lerp(left[3], right[3], local),
  ];
}

function fillMap(
  width: number,
  height: number,
  paint: (lon: number, lat: number) => [number, number, number, number],
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const image = canvas.getContext('2d')!.createImageData(width, height);
  const pixels = image.data;
  for (let y = 0; y < height; y += 1) {
    const lat = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue, alpha] = paint(x / width, lat);
      const offset = (y * width + x) * 4;
      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
      pixels[offset + 3] = alpha;
    }
  }
  canvas.getContext('2d')!.putImageData(image, 0, 0);
  return canvas;
}

const LAND: Array<Array<[number, number]>> = [
  [[0.06, 0.18], [0.09, 0.1], [0.14, 0.12], [0.18, 0.16], [0.23, 0.15], [0.28, 0.22], [0.3, 0.3], [0.27, 0.38], [0.24, 0.46], [0.21, 0.5], [0.18, 0.44], [0.15, 0.36], [0.11, 0.32], [0.08, 0.24]],
  [[0.28, 0.06], [0.33, 0.04], [0.36, 0.09], [0.35, 0.16], [0.31, 0.18], [0.27, 0.12]],
  [[0.21, 0.52], [0.26, 0.5], [0.31, 0.55], [0.32, 0.64], [0.29, 0.76], [0.27, 0.86], [0.23, 0.84], [0.21, 0.72], [0.19, 0.6]],
  [[0.44, 0.34], [0.49, 0.3], [0.56, 0.33], [0.58, 0.42], [0.55, 0.54], [0.52, 0.66], [0.48, 0.72], [0.45, 0.6], [0.43, 0.46]],
  [[0.45, 0.2], [0.5, 0.16], [0.56, 0.18], [0.58, 0.25], [0.52, 0.3], [0.47, 0.28], [0.44, 0.24]],
  [[0.56, 0.14], [0.64, 0.1], [0.76, 0.13], [0.88, 0.18], [0.92, 0.28], [0.86, 0.36], [0.76, 0.4], [0.66, 0.36], [0.58, 0.28], [0.54, 0.2]],
  [[0.66, 0.36], [0.72, 0.38], [0.73, 0.5], [0.68, 0.48], [0.66, 0.4]],
  [[0.78, 0.6], [0.86, 0.58], [0.91, 0.66], [0.87, 0.74], [0.79, 0.72], [0.76, 0.64]],
  [[0.5, 0.66], [0.53, 0.64], [0.55, 0.7], [0.52, 0.73], [0.49, 0.69]],
  [[0.84, 0.7], [0.88, 0.68], [0.9, 0.74], [0.86, 0.78], [0.83, 0.74]],
];

function buildEarthMask(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  LAND.forEach((shape) => {
    ctx.beginPath();
    shape.forEach(([lon, lat], index) => {
      const x = lon * width;
      const y = lat * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillRect(0, height * 0.91, width, height * 0.09);
  return ctx.getImageData(0, 0, width, height).data;
}

const MERCURY_CRATERS = (() => {
  const next = random(41);
  return Array.from({ length: 56 }, () => ({
    lon: next(),
    lat: 0.06 + next() * 0.88,
    radius: next() > 0.86 ? 0.03 + next() * 0.035 : 0.007 + next() * 0.016,
    depth: 16 + next() * 26,
  }));
})();

function stampOval(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  rx: number,
  ry: number,
) {
  let dx = lon - centerLon;
  if (dx > 0.5) dx -= 1;
  if (dx < -0.5) dx += 1;
  const dy = lat - centerLat;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
}

function buildPlanetMap(kind: PlanetKind) {
  const width = 512;
  const height = 256;
  if (kind === 'earth') {
    const mask = buildEarthMask(width, height);
    const landAt = (px: number, py: number) => {
      const sx = (px + width) % width;
      const sy = Math.max(0, Math.min(height - 1, py));
      return mask[(sy * width + sx) * 4] > 128;
    };
    return fillMap(width, height, (lon, lat) => {
      const x = Math.min(width - 1, Math.floor(lon * width));
      const y = Math.min(height - 1, Math.floor(lat * height));
      let land = landAt(x, y);
      const grain = fbmSphere(lon, lat, 3.1);
      const detail = fbmSphere(lon + 1.7, lat, 6);
      const edge = land !== landAt(x + 8, y)
        || land !== landAt(x - 8, y)
        || land !== landAt(x, y + 5)
        || land !== landAt(x, y - 5);
      if (edge) land = grain > 0.44;
      const pole = Math.max(0, (0.09 - lat) / 0.09, (lat - 0.88) / 0.12);
      const greenland = lon > 0.26 && lon < 0.38 && lat < 0.2 ? (0.2 - lat) / 0.16 : 0;
      const ice = Math.max(pole, greenland);
      const dryBelt = lat > 0.32 && lat < 0.5 && lon > 0.4 && lon < 0.64;
      const outback = lat > 0.58 && lat < 0.76 && lon > 0.74 && lon < 0.94;
      let red: number;
      let green: number;
      let blue: number;
      if (land) {
        const dry = (dryBelt || outback) && grain > 0.34;
        if (dry) {
          red = 176 + detail * 36;
          green = 142 + detail * 24;
          blue = 86 + detail * 12;
        } else {
          red = 34 + detail * 28;
          green = 72 + grain * 48;
          blue = 38 + detail * 14;
        }
      } else {
        const shallow = edge ? 0.35 : 0;
        red = 8 + grain * 18 + shallow * 30;
        green = 32 + grain * 48 + shallow * 40;
        blue = 78 + grain * 70 + shallow * 30;
      }
      if (ice > 0) {
        red = lerp(red, 236, ice);
        green = lerp(green, 242, ice);
        blue = lerp(blue, 246, ice);
      }
      return [red, green, blue, 255];
    });
  }

  return fillMap(width, height, (lon, lat) => {
    const grain = fbmSphere(lon, lat, kind === 'venus' ? 2.1 : 2.6);
    if (kind === 'mercury') {
      let shade = (grain - 0.5) * 36;
      MERCURY_CRATERS.forEach((crater) => {
        let dx = lon - crater.lon;
        if (dx > 0.5) dx -= 1;
        if (dx < -0.5) dx += 1;
        const distance = Math.hypot(dx * 2, lat - crater.lat) / crater.radius;
        if (distance < 0.72) shade -= (1 - distance / 0.72) * crater.depth;
        else if (distance < 1.15) shade += (1 - (distance - 0.72) / 0.43) * crater.depth * 0.45;
      });
      return [132 + shade, 124 + shade, 114 + shade, 255];
    }
    if (kind === 'venus') {
      const swirl = fbmSphere(lon + Math.sin(lat * TAU * 3) * 0.12, lat, 3.2);
      const streak = Math.sin((lat * 20 + swirl * 2.4) * Math.PI);
      const tone = 0.25 + swirl * 0.58 + streak * 0.09;
      return [188 + tone * 52, 148 + tone * 58, 72 + tone * 30, 255];
    }
    if (kind === 'mars') {
      const mottled = fbmSphere(lon + 0.4, lat, 6.5);
      const syrtis = stampOval(lon, lat, 0.57, 0.46, 0.12, 0.09);
      const dust = syrtis < 1 ? (1 - syrtis) * 34 : 0;
      const cap = Math.max(0, (0.08 - lat) / 0.08, (lat - 0.91) / 0.09);
      const red = 146 + grain * 58 + (mottled - 0.5) * 22 - dust;
      const green = 72 + grain * 34 + (mottled - 0.5) * 12 - dust * 0.35;
      const blue = 44 + grain * 18 - dust * 0.15;
      if (cap > 0) return [lerp(red, 236, cap), lerp(green, 228, cap), lerp(blue, 216, cap), 255];
      return [red, green, blue, 255];
    }
    if (kind === 'jupiter' || kind === 'saturn') {
      const fine = fbmSphere(lon + 0.15, lat, 5.2);
      const shift = (grain - 0.5) * (kind === 'jupiter' ? 0.06 : 0.03) + (fine - 0.5) * 0.02;
      const y = lat + shift;
      const bands = kind === 'jupiter' ? 13 : 7;
      const stripe = Math.sin((y * bands + fine * 0.85) * Math.PI);
      const tone = 0.5 + stripe * (kind === 'jupiter' ? 0.34 : 0.14) + (fine - 0.5) * 0.28;
      const color = kind === 'jupiter'
        ? mixColor(tone, [[0, 112, 58, 36], [0.35, 176, 104, 62], [0.62, 214, 170, 112], [1, 244, 228, 196]])
        : mixColor(tone, [[0, 186, 156, 104], [0.4, 214, 186, 132], [0.7, 232, 210, 164], [1, 246, 236, 206]]);
      if (kind === 'jupiter') {
        const spot = stampOval(lon, lat, 0.64, 0.62, 0.055, 0.032);
        if (spot < 1) {
          const amount = (1 - spot) ** 1.4;
          return [
            lerp(color[0], 186, amount),
            lerp(color[1], 78, amount),
            lerp(color[2], 58, amount),
            255,
          ];
        }
        const pale = stampOval(lon, lat, 0.28, 0.4, 0.02, 0.012);
        if (pale < 1) {
          const amount = 1 - pale;
          return [lerp(color[0], 236, amount), lerp(color[1], 226, amount), lerp(color[2], 206, amount), 255];
        }
      }
      return [color[0], color[1], color[2], 255];
    }
    if (kind === 'uranus') {
      const tone = 0.5 + Math.sin(lat * Math.PI * 4) * 0.05 + (grain - 0.5) * 0.08;
      const color = mixColor(tone, [[0, 150, 214, 208], [0.5, 186, 232, 226], [1, 214, 244, 240]]);
      return [color[0], color[1], color[2], 255];
    }
    const tone = 0.5 + Math.sin(lat * Math.PI * 7) * 0.12 + (grain - 0.5) * 0.16;
    const color = mixColor(tone, [[0, 16, 36, 92], [0.45, 28, 70, 150], [1, 64, 112, 196]]);
    const storm = stampOval(lon, lat, 0.34, 0.38, 0.04, 0.022);
    if (storm < 1) {
      const amount = (1 - storm) * 0.85;
      return [lerp(color[0], 214, amount), lerp(color[1], 228, amount), lerp(color[2], 236, amount), 255];
    }
    return [color[0], color[1], color[2], 255];
  });
}

function buildClouds() {
  return fillMap(512, 256, (lon, lat) => {
    const grain = fbmSphere(lon + 0.37, lat, 2.2);
    const wisps = fbmSphere(lon + 2.2, lat, 4.6);
    const field = grain * 0.72 + wisps * 0.28;
    const alpha = Math.min(240, Math.max(0, (field - 0.4) * 1700));
    return [244, 248, 252, alpha];
  });
}

const planetMaps: Partial<Record<PlanetKind, HTMLCanvasElement>> = {};
let cloudMap: HTMLCanvasElement | null = null;
const mapPixels = new WeakMap<HTMLCanvasElement, ImageData>();
const discs = new Map<string, { canvas: HTMLCanvasElement; image: ImageData }>();

function mapImage(map: HTMLCanvasElement) {
  let image = mapPixels.get(map);
  if (!image) {
    image = map.getContext('2d')!.getImageData(0, 0, map.width, map.height);
    mapPixels.set(map, image);
  }
  return image;
}

function sampleMap(image: ImageData, u: number, v: number) {
  const { width, height, data } = image;
  let x = u % width;
  if (x < 0) x += width;
  const y = Math.max(0, Math.min(height - 1.001, v));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = (x0 + 1) % width;
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const at = (px: number, py: number) => {
    const offset = (py * width + px) * 4;
    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
  };
  const a = at(x0, y0);
  const b = at(x1, y0);
  const c = at(x0, y1);
  const d = at(x1, y1);
  return [0, 1, 2, 3].map((channel) => {
    const top = a[channel] + (b[channel] - a[channel]) * tx;
    const bottom = c[channel] + (d[channel] - c[channel]) * tx;
    return top + (bottom - top) * ty;
  });
}

function projected(key: string, map: HTMLCanvasElement, radius: number, spin: number) {
  const size = Math.max(4, Math.ceil(radius * 2));
  const id = `${key}:${size}`;
  let slot = discs.get(id);
  if (!slot) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    slot = { canvas, image: canvas.getContext('2d')!.createImageData(size, size) };
    discs.set(id, slot);
  }
  const source = mapImage(map);
  const pixels = slot.image.data;
  for (let y = 0; y < size; y += 1) {
    const ny = 1 - ((y + 0.5) / size) * 2;
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const offset = (y * size + x) * 4;
      const distance = nx * nx + ny * ny;
      if (distance > 1) {
        pixels[offset + 3] = 0;
        continue;
      }
      const nz = Math.sqrt(1 - distance);
      let lon = (Math.atan2(nx, nz) / TAU + 0.5 + spin) % 1;
      if (lon < 0) lon += 1;
      const lat = 0.5 - Math.asin(Math.max(-1, Math.min(1, ny))) / Math.PI;
      const [red, green, blue, alpha] = sampleMap(source, lon * source.width, lat * (source.height - 1));
      const limb = 0.84 + 0.16 * nz;
      pixels[offset] = red * limb;
      pixels[offset + 1] = green * limb;
      pixels[offset + 2] = blue * limb;
      pixels[offset + 3] = alpha;
    }
  }
  slot.canvas.getContext('2d')!.putImageData(slot.image, 0, 0);
  return slot.canvas;
}

function drawSurface(ctx: CanvasRenderingContext2D, planet: Planet, radius: number, time: number) {
  const spin = (time * PORTRAIT_SPIN[planet.kind]) / TAU;
  const disc = projected(planet.kind, planetMaps[planet.kind] ??= buildPlanetMap(planet.kind), radius, spin);
  ctx.drawImage(disc, -radius, -radius, radius * 2, radius * 2);
  if (planet.kind === 'earth') {
    cloudMap ??= buildClouds();
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(projected('clouds', cloudMap, radius, spin * 1.65), -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  kind: PlanetKind,
) {
  const haze: Partial<Record<PlanetKind, string>> = {
    venus: 'rgba(255, 206, 140, 0.34)',
    earth: 'rgba(142, 190, 255, 0.28)',
    mars: 'rgba(214, 132, 84, 0.18)',
    jupiter: 'rgba(226, 186, 132, 0.14)',
    saturn: 'rgba(236, 214, 170, 0.14)',
    uranus: 'rgba(176, 236, 230, 0.2)',
    neptune: 'rgba(120, 164, 255, 0.22)',
  };
  const color = haze[kind];
  if (!color) return;
  const glow = ctx.createRadialGradient(x, y, radius * 0.9, x, y, radius * 1.14);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(0.55, color);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.14, 0, TAU);
  ctx.fill();
}

function ringHalf(
  ctx: CanvasRenderingContext2D,
  inner: number,
  outer: number,
  color: string,
  front: boolean,
) {
  ctx.beginPath();
  if (front) {
    ctx.arc(0, 0, outer, 0, Math.PI);
    ctx.arc(0, 0, inner, Math.PI, 0, true);
  } else {
    ctx.arc(0, 0, outer, Math.PI, TAU);
    ctx.arc(0, 0, inner, 0, Math.PI, true);
  }
  ctx.fillStyle = color;
  ctx.fill();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  radius: number,
  ring: Ring,
  front: boolean,
) {
  const inner = radius * ring.inner;
  const outer = radius * ring.outer;
  const span = outer - inner;
  const faint = ring.tilt > 1;
  const bands: Array<[number, number, string]> = faint
    ? [
      [0.18, 0.28, 'rgba(150, 168, 166, 0.28)'],
      [0.42, 0.5, 'rgba(186, 204, 200, 0.22)'],
      [0.7, 0.78, 'rgba(120, 140, 138, 0.2)'],
    ]
    : [
      [0, 0.08, 'rgba(92, 74, 52, 0.28)'],
      [0.08, 0.2, 'rgba(186, 162, 124, 0.55)'],
      [0.2, 0.46, 'rgba(236, 220, 186, 0.82)'],
      [0.46, 0.54, 'rgba(18, 14, 10, 0.72)'],
      [0.54, 0.72, 'rgba(214, 192, 154, 0.7)'],
      [0.72, 0.8, 'rgba(70, 56, 40, 0.45)'],
      [0.8, 0.92, 'rgba(228, 210, 176, 0.48)'],
      [0.92, 1, 'rgba(168, 146, 112, 0.22)'],
    ];
  ctx.save();
  ctx.rotate(ring.tilt);
  ctx.scale(1, 0.32);
  bands.forEach(([from, to, color]) => {
    ringHalf(ctx, inner + span * from, inner + span * to, color, front);
  });
  ctx.restore();
}

type BodyLook = {
  ring: number;
  scorch: number;
  frost: number;
  melt: number;
  companions?: number;
  stretch?: number;
  aim?: number;
  core?: number;
};

const PLAIN_LOOK: BodyLook = { ring: 1, scorch: 0, frost: 0, melt: 0 };

function drawBody(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  radius: number,
  time: number,
  sunX: number,
  sunY: number,
  scale: number,
  look: BodyLook = PLAIN_LOOK,
) {
  const companions = look.companions ?? 1;
  const moons = planet.moons.map((moon) => {
    const angle = (time / moon.period) * TAU + moon.phase;
    const dist = (radius + moon.dist * scale) * (1 + (1 - companions) * 2.2);
    return {
      moon,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist * 0.62,
      radius: Math.max(1.15, moon.radius * scale),
      behind: Math.sin(angle) < 0,
    };
  });

  moons.filter((moon) => moon.behind).forEach((moon) => {
    if (companions < 0.04) return;
    ctx.save();
    ctx.globalAlpha = companions;
    drawMoon(ctx, moon.moon, moon.x, moon.y, moon.radius, sunX, sunY, time);
    ctx.restore();
  });

  const stretch = look.stretch ?? 0;
  const stretched = stretch > 0.04;
  if (stretched) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(look.aim ?? 0);
    ctx.scale(1 + stretch * 1.65, Math.max(0.42, 1 - stretch * 0.38));
    ctx.rotate(-(look.aim ?? 0));
    ctx.translate(-x, -y);
  }

  if (planet.ring && look.ring > 0.02) {
    ctx.save();
    ctx.globalAlpha = look.ring;
    ctx.translate(x, y);
    drawRing(ctx, radius, planet.ring, false);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  ctx.translate(x, y);
  drawSurface(ctx, planet, radius, time);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  shade(ctx, x, y, radius, sunX, sunY);
  ctx.restore();

  if (look.scorch > 0.02) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    const tone = planet.kind === 'earth' ? '132, 42, 16' : '96, 34, 18';
    const amount = planet.kind === 'earth' ? look.scorch * 0.8 : look.scorch * 0.66;
    ctx.fillStyle = `rgba(${tone}, ${amount})`;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if (look.frost > 0.02) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = `rgba(186, 214, 255, ${look.frost * 0.38})`;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  if ((look.core ?? 0) > 0.08) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(110, 68, 46)';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  drawAtmosphere(ctx, x, y, radius, planet.kind);

  if (planet.ring && look.ring > 0.02) {
    ctx.save();
    ctx.globalAlpha = look.ring;
    ctx.translate(x, y);
    drawRing(ctx, radius, planet.ring, true);
    ctx.restore();
  }
  if (stretched) ctx.restore();

  moons.filter((moon) => !moon.behind).forEach((moon) => {
    if (companions < 0.04) return;
    ctx.save();
    ctx.globalAlpha = companions;
    if (look.melt > 0.02 && (moon.moon.look === 'ice' || moon.moon.look === 'titan')) {
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.radius * 2.6, 0, TAU);
      ctx.fillStyle = `rgba(86, 188, 232, ${look.melt * 0.45})`;
      ctx.fill();
    }
    drawMoon(ctx, moon.moon, moon.x, moon.y, moon.radius, sunX, sunY, time);
    ctx.restore();
  });
}

const FIRE_N = 108;
const heatFront = new Float32Array(FIRE_N * FIRE_N);
const heatBack = new Float32Array(FIRE_N * FIRE_N);
let heatRead = heatFront;
let heatWrite = heatBack;
let sunFire: HTMLCanvasElement | null = null;
let sunFireImage: ImageData | null = null;

function heatColor(amount: number) {
  const t = Math.max(0, Math.min(1, amount));
  if (t < 0.18) return [120, 12, 0, Math.round((t / 0.18) * 210)] as const;
  if (t < 0.42) {
    const u = (t - 0.18) / 0.24;
    return [190 + u * 65, 18 + u * 80, 0, 240] as const;
  }
  if (t < 0.7) {
    const u = (t - 0.42) / 0.28;
    return [255, 100 + u * 130, u * 50, 255] as const;
  }
  const u = (t - 0.7) / 0.3;
  return [255, 235 + u * 20, 90 + u * 165, 255] as const;
}

function stepSunFire() {
  if (!sunFire) {
    sunFire = document.createElement('canvas');
    sunFire.width = FIRE_N;
    sunFire.height = FIRE_N;
    sunFireImage = sunFire.getContext('2d')!.createImageData(FIRE_N, FIRE_N);
  }
  const src = heatRead;
  const dst = heatWrite;
  const half = FIRE_N * 0.5;
  for (let burst = 0; burst < 160; burst += 1) {
    const x = (Math.random() * FIRE_N) | 0;
    const y = (Math.random() * FIRE_N) | 0;
    const dx = x - half;
    const dy = y - half;
    const distance = Math.hypot(dx, dy) / half;
    if (distance > 0.98) continue;
    const cell = y * FIRE_N + x;
    src[cell] = Math.min(1.7, src[cell] + (1.15 - distance * 0.75) * (0.35 + Math.random() * 0.9));
  }
  for (let y = 0; y < FIRE_N; y += 1) {
    for (let x = 0; x < FIRE_N; x += 1) {
      const here = src[y * FIRE_N + x];
      const left = src[y * FIRE_N + ((x + FIRE_N - 1) % FIRE_N)];
      const right = src[y * FIRE_N + ((x + 1) % FIRE_N)];
      const up = src[((y + FIRE_N - 1) % FIRE_N) * FIRE_N + x];
      const down = src[((y + 1) % FIRE_N) * FIRE_N + x];
      dst[y * FIRE_N + x] = (here * 0.46 + left * 0.14 + right * 0.14 + up * 0.13 + down * 0.13) * 0.985;
    }
  }
  heatRead = dst;
  heatWrite = src;
  const image = sunFireImage!;
  const pixels = image.data;
  for (let index = 0; index < FIRE_N * FIRE_N; index += 1) {
    const [red, green, blue, alpha] = heatColor(heatRead[index]);
    const offset = index * 4;
    pixels[offset] = red;
    pixels[offset + 1] = green;
    pixels[offset + 2] = blue;
    pixels[offset + 3] = alpha;
  }
  sunFire.getContext('2d')!.putImageData(image, 0, 0);
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  coronaReach = 3.6,
  flareReach = 1,
) {
  const pulse = 1 + Math.sin(time * 2.4) * 0.02 + Math.sin(time * 6.5) * 0.01;
  const body = radius * pulse;
  stepSunFire();

  const corona = ctx.createRadialGradient(cx, cy, body * 0.7, cx, cy, body * coronaReach);
  corona.addColorStop(0, 'rgba(255, 170, 50, 0.55)');
  corona.addColorStop(0.35, 'rgba(255, 70, 10, 0.2)');
  corona.addColorStop(1, 'rgba(180, 20, 0, 0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, body * coronaReach, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, body, 0, TAU);
  ctx.clip();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.12);
  ctx.drawImage(sunFire!, -body, -body, body * 2, body * 2);
  ctx.rotate(-time * 0.31);
  ctx.globalAlpha = 0.55;
  ctx.drawImage(sunFire!, -body * 1.05, -body * 1.05, body * 2.1, body * 2.1);
  ctx.restore();
  const limb = ctx.createRadialGradient(cx, cy, body * 0.35, cx, cy, body);
  limb.addColorStop(0, 'rgba(255, 255, 240, 0.18)');
  limb.addColorStop(0.55, 'rgba(255, 120, 20, 0)');
  limb.addColorStop(1, 'rgba(90, 10, 0, 0.28)');
  ctx.fillStyle = limb;
  ctx.fillRect(cx - body, cy - body, body * 2, body * 2);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 42; index += 1) {
    const angle = (index / 42) * TAU + time * 0.35;
    const sx = Math.max(0, Math.min(FIRE_N - 1, Math.round(FIRE_N / 2 + Math.cos(angle) * FIRE_N * 0.34)));
    const sy = Math.max(0, Math.min(FIRE_N - 1, Math.round(FIRE_N / 2 + Math.sin(angle) * FIRE_N * 0.34)));
    const heat = heatRead[sy * FIRE_N + sx];
    if (heat < 0.35) continue;
    const length = body * (0.16 + heat * 0.7) * flareReach;
    const px = Math.cos(angle) * body * 0.9;
    const py = Math.sin(angle) * body * 0.9;
    const flare = ctx.createRadialGradient(px, py, 0, px, py, length);
    flare.addColorStop(0, `rgba(255, 236, 170, ${0.25 + heat * 0.45})`);
    flare.addColorStop(0.4, `rgba(255, 110, 16, ${0.28 * heat})`);
    flare.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(px, py, length, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawMeteor(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const cycle = 18;
  const along = time % cycle;
  if (along > 0.85) return;
  const flight = along / 0.85;
  const trip = Math.floor(time / cycle);
  const next = random(90 + trip);
  const startX = width * (0.15 + next() * 0.7);
  const startY = height * (0.08 + next() * 0.35);
  const endX = startX + width * (0.12 + next() * 0.1);
  const endY = startY + height * (0.08 + next() * 0.08);
  const x = startX + (endX - startX) * flight;
  const y = startY + (endY - startY) * flight;
  const trail = 1 - flight;
  const gradient = ctx.createLinearGradient(x, y, x - (endX - startX) * 0.35, y - (endY - startY) * 0.35);
  gradient.addColorStop(0, `rgba(255, 248, 230, ${0.85 * trail})`);
  gradient.addColorStop(1, 'rgba(255, 248, 230, 0)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - (endX - startX) * 0.35, y - (endY - startY) * 0.35);
  ctx.stroke();
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smooth(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function between(progress: number, start: number, end: number) {
  return smooth((progress - start) / (end - start));
}

const ORBIT_END: Record<PlanetKind, number> = {
  mercury: 1,
  venus: 1,
  earth: 1.41,
  mars: 1.73,
  jupiter: 1.86,
  saturn: 1.83,
  uranus: 1.7,
  neptune: 1.61,
};

export const SUN_DEATH_MARKS = [0, 0.16, 0.3, 0.42, 0.54, 0.66, 0.8];

export function sunDeathBeat(progress: number) {
  let index = 0;
  SUN_DEATH_MARKS.forEach((mark, markIndex) => {
    if (progress >= mark) index = markIndex;
  });
  return index;
}

export type FateFocus = 'present' | 'giant' | 'dwarf' | 'earth' | 'mars' | 'belt' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export function fateFocus(kind: SceneKind, progress: number): FateFocus {
  if (progress <= 0) return 'present';
  const fate = sunFate(progress);
  if (kind === 'sun') {
    if (fate.dwarf > 0.5) return 'dwarf';
    if (fate.giant > 0.3) return 'giant';
    return 'present';
  }
  if (kind === 'earth' && fate.scorch > 0.4) return 'earth';
  if (kind === 'mars' && fate.scorch > 0.4) return 'mars';
  if (kind === 'belt' && fate.shatter > 0.4) return 'belt';
  if (kind === 'jupiter' && fate.bloat > 0.4) return 'jupiter';
  if (kind === 'saturn' && fate.rings < 0.35) return 'saturn';
  if (kind === 'uranus' && fate.swell > 0.4) return 'uranus';
  if (kind === 'neptune' && fate.migrate > 0.55) return 'neptune';
  return 'present';
}

type SunFate = {
  view: number;
  sunDraw: number;
  giant: number;
  dwarf: number;
  winter: number;
  scorch: number;
  shatter: number;
  fling: number;
  rings: number;
  bloat: number;
  swell: number;
  melt: number;
  migrate: number;
};

function sunFate(progress: number): SunFate {
  const swell = between(progress, 0.02, 0.3);
  const collapse = between(progress, 0.7, 0.84);
  const migrate = between(progress, 0.42, 0.76);
  return {
    view: lerp(1, 0.62, migrate),
    sunDraw: lerp(lerp(1, 3.6, swell), 0.34, collapse) * lerp(1, 0.86, migrate),
    giant: swell * (1 - collapse),
    dwarf: collapse,
    winter: between(progress, 0.78, 0.95),
    scorch: between(progress, 0.22, 0.4),
    shatter: between(progress, 0.34, 0.56),
    fling: between(progress, 0.42, 0.68),
    rings: 1 - between(progress, 0.48, 0.66),
    bloat: between(progress, 0.46, 0.68),
    swell: between(progress, 0.52, 0.72),
    melt: between(progress, 0.5, 0.66) * (1 - between(progress, 0.76, 0.92)),
    migrate,
  };
}

function placeBodies(width: number, height: number, time: number, epoch: number | SceneClock = 0) {
  const clock = readClock(epoch);
  const metrics = sceneMetrics(width, height);
  const fate = sunFate(clock.sun);
  const sunPx = metrics.sunRadius * fate.sunDraw;
  const bodies = PLANETS.map((planet) => {
    const mul = lerp(1, ORBIT_END[planet.kind], fate.migrate);
    const orbitPx = metrics.reach * planet.orbit * mul * fate.view;
    const angle = (time / planet.period) * TAU + planet.phase;
    const point = place(metrics.cx, metrics.cy, angle, orbitPx);
    const bulk = planet.kind === 'jupiter'
      ? 1 + fate.bloat * 0.5
      : planet.kind === 'uranus'
        ? 1 + fate.swell * 0.38
        : 1;
    const radius = Math.max(
      planet.kind === 'jupiter' || planet.kind === 'saturn' ? 4 : 1.6,
      planet.radius * metrics.scale,
    ) * bulk;
    const inner = planet.kind === 'mercury' || planet.kind === 'venus';
    const covered = orbitPx < sunPx * 0.98;
    const swallowed = between(clock.sun, 0.22, 0.34);
    const shift = shiftBody(planet.kind, point.x, point.y, angle, orbitPx, metrics.cx, metrics.cy, metrics.reach, clock, time);
    const hole = holeShift(planet.kind, shift.x, shift.y, angle, shift.orbitRx, shift.orbitCx, shift.orbitCy, metrics.reach, clock.hole, time);
    const gone = (inner && clock.rogue <= 0 && clock.hole <= 0 && (covered || swallowed === 1)) || shift.gone || hole.gone;
    const core = hole.core;
    const look: BodyLook = {
      ring: planet.kind === 'saturn' ? Math.min(fate.rings, hole.rings) : 1,
      scorch: (planet.kind === 'earth' || planet.kind === 'mars' ? fate.scorch : 0) + shift.scorch,
      frost: gone ? 0 : Math.max(fate.winter, shift.frost, hole.frost),
      melt: planet.kind === 'saturn' || planet.kind === 'neptune' ? fate.melt : 0,
      companions: Math.min(shift.companions, hole.companions),
      stretch: hole.stretch,
      aim: hole.aim,
      core,
    };
    return {
      planet,
      x: hole.x,
      y: hole.y,
      homeX: point.x,
      homeY: point.y,
      radius: radius * (planet.kind === 'jupiter' || planet.kind === 'saturn' ? lerp(1, 0.5, core) : 1),
      orbitPx,
      orbitCx: hole.orbitCx,
      orbitCy: hole.orbitCy,
      orbitRx: hole.orbitRx,
      orbitFade: Math.max(shift.orbitFade, hole.orbitFade),
      gone,
      look,
    };
  });
  return { ...metrics, fate, sunPx, bodies, clock };
}

export function rogueDisk(width: number, height: number, epoch: number | SceneClock = 0, time = 0) {
  const clock = readClock(epoch);
  const { cx, cy, reach } = sceneMetrics(width, height);
  const body = rogueBody(cx, cy, reach, clock, time);
  if (!body || clock.choice < 0.8 || clock.ending !== 'capture') return null;
  return { x: body.x, y: body.y, body: body.radius };
}

export function paintSolarSystem(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  epoch: number | SceneClock = 0,
) {
  const { reach, cx, cy, scale, fate, sunPx, bodies: placed, clock } = placeBodies(width, height, time, epoch);
  const shake = Math.max(rogueShake(clock), holeShake(clock.hole));
  const holeAt = clock.hole > 0 ? holePoint(cx, cy, reach, clock.hole) : null;
  const holeNow = holeCues(clock.hole);

  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createRadialGradient(cx, cy, reach * 0.2, cx, cy, Math.max(width, height) * 0.72);
  sky.addColorStop(0, '#10182a');
  sky.addColorStop(0.55, '#070b14');
  sky.addColorStop(1, '#03040a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  if (shake > 0.04) {
    ctx.save();
    ctx.translate(Math.sin(time * 46) * shake * 8, Math.cos(time * 39) * shake * 6);
  }

  const clouds: Array<[number, number, number, string]> = [
    [0.22, 0.72, 0.22, 'rgba(150, 168, 214, 0.07)'],
    [0.38, 0.58, 0.16, 'rgba(226, 220, 236, 0.06)'],
    [0.55, 0.44, 0.2, 'rgba(176, 190, 224, 0.055)'],
    [0.7, 0.32, 0.16, 'rgba(230, 224, 240, 0.05)'],
    [0.18, 0.24, 0.26, 'rgba(72, 98, 168, 0.14)'],
    [0.84, 0.8, 0.22, 'rgba(104, 62, 112, 0.1)'],
  ];
  clouds.forEach(([x, y, radius, color]) => {
    const glow = ctx.createRadialGradient(width * x, height * y, 0, width * x, height * y, width * radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(width * x, height * y, width * radius, 0, TAU);
    ctx.fill();
  });

  STARS.forEach((star) => {
    const drift = time * (0.8 + star.layer * 3.2);
    let x = ((star.x * width + drift) % width + width) % width;
    let y = star.y * height;
    const alpha = star.alpha * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * star.twinkle + star.phase)));
    const warped = holeAt ? warpStar(x, y, holeAt, reach * 0.2, holeNow.lens) : null;
    if (warped) {
      x = warped.x;
      y = warped.y;
    }
    ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
    if (warped && warped.stretch > 1.35) {
      const arm = star.r * warped.stretch * 2.2;
      ctx.strokeStyle = `rgba(${star.tint}, ${alpha})`;
      ctx.lineWidth = Math.max(0.8, star.r);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(warped.angle) * arm, y - Math.sin(warped.angle) * arm);
      ctx.lineTo(x + Math.cos(warped.angle) * arm, y + Math.sin(warped.angle) * arm);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, TAU);
      ctx.fill();
    }
    if (!star.spike || (warped && warped.stretch > 1.35)) return;
    ctx.strokeStyle = `rgba(${star.tint}, ${alpha * 0.7})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - star.r * 4.5, y);
    ctx.lineTo(x + star.r * 4.5, y);
    ctx.moveTo(x, y - star.r * 4.5);
    ctx.lineTo(x, y + star.r * 4.5);
    ctx.stroke();
  });

  drawMeteor(ctx, width, height, time);

  const bodies = [...placed].sort((a, b) => a.y - b.y);
  const beltSpan = fate.view;

  ctx.lineWidth = 1;
  bodies.forEach((body) => {
    if (body.gone) return;
    ctx.save();
    ctx.globalAlpha = 1 - body.orbitFade;
    ctx.strokeStyle = 'rgba(236, 228, 214, 0.14)';
    ctx.beginPath();
    ctx.ellipse(body.orbitCx, body.orbitCy, body.orbitRx, body.orbitRx * TILT, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  });
  drawRogueCourses(ctx, clock, bodies.map((body) => ({
    kind: body.planet.kind,
    x: body.x,
    y: body.y,
    homeX: body.homeX,
    homeY: body.homeY,
  })));
  drawRogueUnder(ctx, time, cx, cy, reach, clock);
  drawHoleUnder(ctx, cx, cy, reach, clock.hole);
  const beltBreak = clock.hole > 0 ? Math.max(holeNow.theft, holeNow.shatter * 0.85, holeNow.grave) : 0;
  const beltFade = (1 - fate.shatter) * (1 - beltBreak * 0.94);
  const beltCx = cx + reach * 0.09 * beltBreak;
  const beltCy = cy - reach * 0.04 * beltBreak;
  const beltInner = reach * 0.475 * beltSpan * (1 + beltBreak * 0.28);
  const beltOuter = reach * 0.56 * beltSpan * (1 - beltBreak * 0.06);
  const beltTilt = beltBreak * 0.28;
  ctx.strokeStyle = `rgba(236, 228, 214, ${0.14 * beltFade})`;
  ctx.beginPath();
  ctx.ellipse(beltCx, beltCy, beltInner, beltInner * TILT, beltTilt, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(beltCx, beltCy, beltOuter, beltOuter * TILT, beltTilt, 0, TAU);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(beltCx, beltCy, beltOuter, beltOuter * TILT, beltTilt, 0, TAU);
  ctx.ellipse(beltCx, beltCy, beltInner * 0.99, beltInner * 0.99 * TILT, beltTilt, 0, TAU);
  ctx.fillStyle = `rgba(186, 164, 128, ${0.055 * beltFade})`;
  ctx.fill('evenodd');

  if (clock.sun > 0) {
    bodies.filter((body) => !body.gone && (body.planet.kind === 'mercury' || body.planet.kind === 'venus')).forEach((body) => {
      drawBody(ctx, body.planet, body.x, body.y, body.radius, time, cx, cy, scale, body.look);
    });
  }

  const drained = Math.max(holeNow.drain * 0.45, holeNow.grave);
  const sunDrawPx = sunPx * (clock.hole > 0 ? lerp(1, 0.56, drained) : 1);
  ctx.save();
  ctx.translate(cx, cy);
  if (holeAt && holeNow.drain > 0.04) {
    const aim = Math.atan2(holeAt.y - cy, holeAt.x - cx);
    ctx.rotate(aim);
    ctx.scale(1 + holeNow.drain * 0.9, Math.max(0.55, 1 - holeNow.drain * 0.32));
    ctx.rotate(-aim);
  }
  ctx.scale(1, lerp(1, TILT, fate.giant));
  drawSun(ctx, 0, 0, sunDrawPx, time, lerp(3.6, 1.05, Math.max(fate.giant, drained)), lerp(1, 0.16, Math.max(fate.giant, drained * 0.85)));
  if (fate.giant > 0.04) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, sunDrawPx, 0, TAU);
    ctx.clip();
    ctx.fillStyle = `rgba(160, 18, 0, ${fate.giant * 0.42})`;
    ctx.fillRect(-sunDrawPx, -sunDrawPx, sunDrawPx * 2, sunDrawPx * 2);
    ctx.restore();
  }
  if (drained > 0.04) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, sunDrawPx, 0, TAU);
    ctx.clip();
    ctx.fillStyle = `rgba(110, 16, 6, ${0.28 + drained * 0.5})`;
    ctx.fillRect(-sunDrawPx, -sunDrawPx, sunDrawPx * 2, sunDrawPx * 2);
    ctx.restore();
  }
  ctx.restore();
  if (fate.dwarf > 0.04) {
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(8, sunPx * 2.4));
    core.addColorStop(0, `rgba(246, 250, 255, ${0.35 + fate.dwarf * 0.6})`);
    core.addColorStop(0.45, `rgba(186, 214, 255, ${fate.dwarf * 0.45})`);
    core.addColorStop(1, 'rgba(120, 160, 230, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(8, sunPx * 2.4), 0, TAU);
    ctx.fill();
  }
  if (fate.dwarf < 0.65 && fate.giant < 0.12 && drained < 0.35) drawSolarActivity(ctx, cx, cy, sunDrawPx, time);

  const rocks = ROCKS.map((rock) => {
    const angle = (time / rock.period) * TAU + rock.phase;
    const slip = (Math.sin(rock.phase * 12.3) + 1) / 2;
    const leaving = slip > 0.42;
    const sunFly = leaving ? fate.fling * (0.25 + slip * 0.85) : 0;
    const lobe = Math.sin(rock.phase * 4.7);
    const kick = beltBreak * (0.32 + slip * 0.62) * (lobe > 0 ? 1 : -0.78);
    const bend = beltBreak * Math.sin(rock.phase * 2.2) * 0.85;
    const point = place(cx, cy, angle + bend, reach * rock.orbit * beltSpan);
    return {
      rock,
      angle: angle + bend,
      x: point.x + Math.cos(angle) * reach * (sunFly + kick),
      y: point.y + Math.sin(angle) * reach * (sunFly + kick) * TILT + Math.sin(angle * 2 + rock.phase) * rock.incline * scale * (1 + beltBreak * 2.6),
      alpha: leaving ? 1 - fate.fling : Math.max(0.22, 1 - fate.shatter * 0.82 - beltBreak * (slip > 0.92 ? 0.4 : 0)),
      sizeMul: leaving ? 1 : 1 - fate.shatter * 0.55,
      spinUp: 1 + fate.shatter * 14 + beltBreak * 7,
    };
  });
  const ceresAngleNow = ceresAngle(time) + beltBreak * 0.75;
  const ceresPoint = place(cx, cy, ceresAngleNow, reach * CERES.orbit * beltSpan * (1 + beltBreak * 0.42));
  const ceres = {
    angle: ceresAngleNow,
    x: ceresPoint.x,
    y: ceresPoint.y,
    radius: Math.max(3.6, 4.4 * scale),
  };
  const clearOfCeres = (x: number, y: number, pad: number) => Math.hypot(x - ceres.x, y - ceres.y) > ceres.radius + pad;
  const jupiter = PLANETS.find((planet) => planet.kind === 'jupiter');
  const jupiterAngle = jupiter ? (time / jupiter.period) * TAU + jupiter.phase : 0;
  const trojans = TROJANS.map((trojan) => {
    const camp = trojan.lead ? 1 : -1;
    const libration = Math.sin(time * 0.12 + trojan.phase) * 0.04;
    const angle = jupiterAngle + camp * (Math.PI / 3) + trojan.spread + libration;
    const jupiterMul = lerp(1, ORBIT_END.jupiter, fate.migrate);
    const orbit = ((jupiter?.orbit ?? 0.64) + trojan.radial) * jupiterMul * fate.view;
    const point = place(cx, cy, angle, reach * orbit);
    return {
      rock: trojan,
      angle,
      x: point.x,
      y: point.y + Math.sin(angle * 2 + trojan.phase) * trojan.incline * scale,
      alpha: 1 - fate.fling * 0.35,
      sizeMul: 1,
      spinUp: 1,
    };
  });

  const drawCluster = (
    items: Array<{ rock: Rock; angle: number; x: number; y: number; alpha: number; sizeMul: number; spinUp: number }>,
    front: boolean,
    avoidCeres: boolean,
  ) => {
    items.forEach((rock) => {
      if (rock.alpha <= 0.03) return;
      const ahead = Math.sin(rock.angle) >= 0;
      if (ahead !== front) return;
      const size = Math.max(0.8, rock.rock.size * scale) * rock.sizeMul;
      if (avoidCeres && !clearOfCeres(rock.x, rock.y, size)) return;
      ctx.save();
      ctx.globalAlpha = rock.alpha;
      ctx.translate(rock.x, rock.y);
      ctx.rotate(rock.rock.spin + time * 0.2 * rock.spinUp);
      ctx.fillStyle = rock.rock.color;
      ctx.beginPath();
      rock.rock.shape.forEach(([px, py], index) => {
        if (index === 0) ctx.moveTo(px * size, py * size);
        else ctx.lineTo(px * size, py * size);
      });
      ctx.closePath();
      ctx.fill();
      if (size > 2.4) {
        ctx.fillStyle = 'rgba(20, 16, 12, 0.35)';
        ctx.beginPath();
        ctx.arc(size * 0.15, size * 0.05, size * 0.28, 0, TAU);
        ctx.fill();
      }
      if (rock.spinUp > 2) {
        ctx.fillStyle = 'rgba(214, 196, 168, 0.8)';
        ctx.beginPath();
        ctx.arc(Math.cos(time * 3) * size * 2.2, Math.sin(time * 3) * size * 1.2, Math.max(0.6, size * 0.35), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  const beltLabel = place(beltCx, beltCy, -0.35 + beltBreak * 0.4, beltOuter);
  const ceresFade = 1 - fate.shatter * 0.92;
  const drawPlaced = (body: (typeof bodies)[number]) => {
    if (body.gone) return;
    if (clock.sun > 0 && (body.planet.kind === 'mercury' || body.planet.kind === 'venus')) return;
    drawBody(ctx, body.planet, body.x, body.y, body.radius, time, cx, cy, scale, body.look);
  };

  drawCluster(rocks, false, true);
  drawCluster(trojans, false, false);
  if (ceresFade > 0.04 && Math.sin(ceres.angle) < 0) {
    ctx.save();
    ctx.globalAlpha = ceresFade;
    drawCeres(ctx, ceres.x, ceres.y, ceres.radius * (1 - fate.shatter * 0.35), time, cx, cy);
    ctx.restore();
  }
  bodies.filter((body) => body.y < cy).forEach(drawPlaced);
  drawCluster(rocks, true, true);
  drawCluster(trojans, true, false);
  if (ceresFade > 0.04 && Math.sin(ceres.angle) >= 0) {
    ctx.save();
    ctx.globalAlpha = ceresFade;
    drawCeres(ctx, ceres.x, ceres.y, ceres.radius * (1 - fate.shatter * 0.35), time, cx, cy);
    ctx.restore();
  }
  bodies.filter((body) => body.y >= cy).forEach(drawPlaced);
  const mars = placed.find((body) => body.planet.kind === 'mars');
  const earth = placed.find((body) => body.planet.kind === 'earth');
  drawRogueOver(ctx, time, cx, cy, reach, clock, mars && !mars.gone ? { x: mars.x, y: mars.y } : mars ? { x: mars.homeX, y: mars.homeY } : null);
  drawHoleOver(ctx, time, width, height, cx, cy, reach, clock.hole, earth ? { x: earth.x, y: earth.y } : null);

  if (fate.winter > 0.02) {
    const cold = ctx.createRadialGradient(cx, cy, reach * 0.08, cx, cy, Math.max(width, height) * 0.72);
    cold.addColorStop(0, `rgba(10, 18, 36, ${fate.winter * 0.12})`);
    cold.addColorStop(1, `rgba(3, 8, 20, ${fate.winter * 0.62})`);
    ctx.fillStyle = cold;
    ctx.fillRect(0, 0, width, height);
  }

  const vignette = ctx.createRadialGradient(cx, cy, reach * 0.55, cx, cy, Math.max(width, height) * 0.68);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.font = `${width < 720 ? 500 : 600} ${width < 720 ? 11 : 12}px Figtree, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'middle';
  const taken: Array<{ x: number; y: number; w: number; h: number }> = [
    { x: 8, y: 8, w: 220, h: 52 },
    { x: 8, y: height - (clock.sun > 0 || clock.rogue > 0 || clock.hole > 0 ? 360 : 128), w: clock.sun > 0 || clock.rogue > 0 || clock.hole > 0 ? 420 : 230, h: clock.sun > 0 || clock.rogue > 0 || clock.hole > 0 ? 352 : 118 },
  ];
  const writeLabel = (text: string, x: number, y: number, color: string) => {
    const box = { x, y: y - 8, w: ctx.measureText(text).width, h: 16 };
    const crowded = taken.some((item) => (
      box.x < item.x + item.w + 10
      && box.x + box.w + 10 > item.x
      && box.y < item.y + item.h + 8
      && box.y + box.h + 8 > item.y
    ));
    const inSun = Math.hypot(x - cx, y - cy) < sunPx + 16;
    if (crowded || inSun || x + box.w > width - 8 || y < 8 || y > height - 8) return;
    taken.push(box);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  [...bodies].sort((a, b) => b.planet.orbit - a.planet.orbit).forEach((body) => {
    if (body.gone) return;
    writeLabel(body.planet.name, body.x + body.radius + 7, body.y - body.radius * 0.15, 'rgba(236, 228, 214, 0.84)');
  });
  if (width >= 800 && beltFade > 0.18) writeLabel('Asteroid belt', beltLabel.x, beltLabel.y, 'rgba(201, 187, 168, 0.62)');
  if (ceresFade > 0.35) writeLabel('Ceres', ceres.x + ceres.radius + 6, ceres.y - ceres.radius * 0.15, 'rgba(236, 228, 214, 0.8)');
  if (shake > 0.04) ctx.restore();
}
