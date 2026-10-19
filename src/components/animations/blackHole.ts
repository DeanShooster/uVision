const TAU = Math.PI * 2;
const TILT = 0.56;

export const HOLE_MARKS = [0, 0.16, 0.34, 0.52, 0.7, 0.9];
export const HOLE_SECONDS = 42;

const PATH: Array<[number, number, number]> = [
  [0, 1.28, -0.52],
  [0.18, 0.96, -0.34],
  [0.36, 0.66, -0.14],
  [0.54, 0.18, 0.02],
  [0.76, -0.02, 0.04],
  [1, -1.28, 0.52],
];

const driftEpoch: Partial<Record<string, number>> = {};

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

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function holeBeat(progress: number) {
  let index = 0;
  HOLE_MARKS.forEach((mark, markIndex) => {
    if (progress >= mark) index = markIndex;
  });
  return index;
}

export type HoleCues = {
  comets: number;
  lens: number;
  buckle: number;
  theft: number;
  shatter: number;
  drain: number;
  jets: number;
  exit: number;
  grave: number;
  shake: number;
};

export function holeCues(progress: number): HoleCues {
  return {
    comets: between(progress, 0.02, 0.1) * (1 - between(progress, 0.4, 0.58)),
    lens: between(progress, 0.14, 0.28) * (1 - between(progress, 0.88, 0.98)),
    buckle: between(progress, 0.16, 0.36),
    theft: between(progress, 0.34, 0.5),
    shatter: between(progress, 0.5, 0.68),
    drain: between(progress, 0.7, 0.86),
    jets: between(progress, 0.74, 0.84) * (1 - between(progress, 0.9, 0.98)),
    exit: between(progress, 0.86, 0.98),
    grave: between(progress, 0.9, 1),
    shake: Math.max(
      Math.sin(clamp01((progress - 0.52) / 0.16) * Math.PI) * 0.7,
      Math.sin(clamp01((progress - 0.74) / 0.14) * Math.PI),
    ),
  };
}

export function holeSunScale(progress: number) {
  const cues = holeCues(progress);
  return lerp(1, 0.56, Math.max(cues.drain * 0.45, cues.grave));
}

export type HoleFocus = 'present' | 'sun' | 'belt' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export function holeFocus(kind: string, progress: number): HoleFocus {
  if (progress < 0.88) return 'present';
  if (kind === 'sun' || kind === 'belt' || kind === 'mercury' || kind === 'venus' || kind === 'earth' || kind === 'mars' || kind === 'jupiter' || kind === 'saturn' || kind === 'uranus' || kind === 'neptune') {
    return kind;
  }
  return 'present';
}

export function holePoint(cx: number, cy: number, reach: number, progress: number) {
  let index = 0;
  while (index < PATH.length - 2 && progress > PATH[index + 1][0]) index += 1;
  const from = PATH[index];
  const to = PATH[index + 1];
  const t = smooth((progress - from[0]) / (to[0] - from[0]));
  return {
    x: cx + reach * lerp(from[1], to[1], t),
    y: cy + reach * lerp(from[2], to[2], t),
  };
}

function driftAngle(kind: string, time: number, grave: number, period: number) {
  if (grave < 0.98) {
    delete driftEpoch[kind];
    return 0;
  }
  if (driftEpoch[kind] === undefined) driftEpoch[kind] = time;
  return ((time - (driftEpoch[kind] ?? time)) / period) * TAU;
}

function onEllipse(orbitCx: number, orbitCy: number, orbitRx: number, angle: number) {
  return {
    x: orbitCx + Math.cos(angle) * orbitRx,
    y: orbitCy + Math.sin(angle) * orbitRx * TILT,
  };
}

export type HoleShift = {
  x: number;
  y: number;
  orbitCx: number;
  orbitCy: number;
  orbitRx: number;
  orbitFade: number;
  gone: boolean;
  companions: number;
  frost: number;
  stretch: number;
  aim: number;
  core: number;
  rings: number;
};

export function holeShift(
  kind: string,
  x: number,
  y: number,
  angle: number,
  orbitPx: number,
  cx: number,
  cy: number,
  reach: number,
  progress: number,
  time: number,
): HoleShift {
  const base: HoleShift = {
    x,
    y,
    orbitCx: cx,
    orbitCy: cy,
    orbitRx: orbitPx,
    orbitFade: 0,
    gone: false,
    companions: 1,
    frost: 0,
    stretch: 0,
    aim: 0,
    core: 0,
    rings: 1,
  };
  if (progress <= 0) return base;
  const cues = holeCues(progress);
  const hole = holePoint(cx, cy, reach, progress);
  let nextX = x;
  let nextY = y;
  let orbitCx = cx;
  let orbitCy = cy;
  let orbitRx = orbitPx;
  let orbitFade = 0;
  let gone = false;
  let companions = 1;
  let frost = 0;
  let stretch = 0;
  let core = 0;
  let rings = 1;
  const aim = Math.atan2(hole.y - y, hole.x - x);
  const mix = (tx: number, ty: number, amount: number) => {
    nextX = lerp(nextX, tx, amount);
    nextY = lerp(nextY, ty, amount);
  };
  const settle = (spin: number, amount: number) => {
    const point = onEllipse(orbitCx, orbitCy, orbitRx, angle + spin);
    mix(point.x, point.y, amount);
  };

  if (kind === 'neptune') {
    const pull = Math.max(cues.buckle, cues.grave);
    orbitCx = cx + reach * lerp(0.12 * cues.buckle, 0.68, cues.grave);
    orbitCy = cy - reach * lerp(0.05 * cues.buckle, 0.3, cues.grave);
    orbitRx = lerp(orbitPx * lerp(1, 1.12, cues.buckle), reach * 0.24, cues.grave);
    settle(driftAngle('neptune', time, cues.grave, 54), pull);
    companions = 1 - pull;
    frost = cues.grave;
  }
  if (kind === 'uranus') {
    const pull = Math.max(cues.buckle, cues.grave);
    orbitCx = cx + reach * 0.16 * pull;
    orbitCy = cy + reach * 0.05 * pull;
    orbitRx = orbitPx * lerp(1, 1.22, pull);
    settle(driftAngle('uranus', time, cues.grave, 46), pull);
    companions = 1 - pull * 0.85;
    frost = cues.grave * 0.8;
  }
  if (kind === 'jupiter') {
    const tear = Math.max(cues.theft, cues.grave);
    stretch = cues.theft * (1 - cues.grave);
    core = Math.max(cues.theft * 0.9, cues.grave);
    companions = 1 - tear;
    orbitCx = cx + reach * 0.1 * tear;
    orbitCy = cy + reach * 0.05 * cues.grave;
    orbitRx = lerp(orbitPx, reach * 0.52, tear);
    mix(hole.x, hole.y, cues.theft * 0.22);
    settle(driftAngle('jupiter', time, cues.grave, 42), tear);
  }
  if (kind === 'saturn') {
    const tear = Math.max(cues.theft * 0.75, cues.grave);
    stretch = cues.theft * 0.55 * (1 - cues.grave);
    core = Math.max(cues.theft * 0.7, cues.grave);
    rings = 1 - tear;
    companions = 1 - tear;
    orbitCx = cx - reach * 0.08 * cues.grave;
    orbitCy = cy + reach * 0.1 * tear;
    orbitRx = lerp(orbitPx, reach * 0.6, tear);
    settle(driftAngle('saturn', time, cues.grave, 48), tear);
  }
  if (kind === 'earth') {
    stretch = cues.shatter * (1 - cues.grave);
    gone = cues.shatter > 0.7;
    companions = 1 - cues.shatter;
    orbitFade = Math.min(1, cues.shatter * 1.1);
    mix(hole.x, hole.y, cues.shatter * 0.62);
  }
  if (kind === 'mars') {
    const pull = Math.max(cues.shatter * 0.35, cues.grave);
    frost = Math.max(cues.drain * 0.35, cues.grave);
    orbitCx = cx - reach * 0.14 * pull;
    orbitCy = cy + reach * 0.12 * pull;
    orbitRx = orbitPx * lerp(1, 1.65, pull);
    settle(driftAngle('mars', time, cues.grave, 34), pull);
  }
  if (kind === 'venus' || kind === 'mercury') {
    const pull = cues.grave;
    frost = pull;
    orbitCx = cx + reach * (kind === 'venus' ? 0.05 : -0.04) * pull;
    orbitCy = cy + reach * 0.04 * pull;
    orbitRx = orbitPx * lerp(1, kind === 'venus' ? 1.35 : 1.2, pull);
    settle(driftAngle(kind, time, pull, kind === 'venus' ? 26 : 18), pull);
  }
  return {
    x: nextX,
    y: nextY,
    orbitCx,
    orbitCy,
    orbitRx,
    orbitFade,
    gone,
    companions,
    frost,
    stretch,
    aim,
    core,
    rings,
  };
}

export function holeShake(progress: number) {
  return holeCues(progress).shake;
}

export function warpStar(
  x: number,
  y: number,
  hole: { x: number; y: number },
  radius: number,
  lens: number,
) {
  const dx = x - hole.x;
  const dy = y - hole.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  if (lens < 0.04 || dist > radius || dist < 10) return { x, y, stretch: 1, angle: 0 };
  const closeness = (1 - dist / radius) * lens;
  const angle = Math.atan2(dy, dx);
  const push = closeness * radius * 0.32;
  return {
    x: x + Math.cos(angle) * push,
    y: y + Math.sin(angle) * push,
    stretch: 1 + closeness * 3.4,
    angle: angle + Math.PI / 2,
  };
}

export function drawHoleUnder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  reach: number,
  progress: number,
) {
  const cues = holeCues(progress);
  if (cues.comets < 0.04) return;
  for (let index = 0; index < 26; index += 1) {
    const fall = (progress * 1.15 + index * 0.041) % 1;
    const angle = index * 2.399 + fall * (index % 2 === 0 ? 1.5 : -1.1);
    const radius = lerp(reach * (1.05 + (index % 4) * 0.04), reach * (0.12 + (index % 5) * 0.05), fall);
    const headX = cx + Math.cos(angle) * radius;
    const headY = cy + Math.sin(angle) * radius * TILT;
    const tailAngle = angle + (index % 3 - 1) * 0.9;
    const tail = radius + reach * (0.08 + (index % 3) * 0.03);
    const tailX = cx + Math.cos(tailAngle) * tail;
    const tailY = cy + Math.sin(tailAngle) * tail * TILT;
    const alpha = cues.comets * Math.sin(fall * Math.PI) * 0.75;
    ctx.strokeStyle = `rgba(186, 214, 255, ${alpha})`;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.fillStyle = `rgba(244, 248, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(headX, headY, 1.5, 0, TAU);
    ctx.fill();
  }
}

export function drawHoleOver(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
  cx: number,
  cy: number,
  reach: number,
  progress: number,
  earth: { x: number; y: number } | null,
) {
  if (progress <= 0) return;
  const cues = holeCues(progress);
  const hole = holePoint(cx, cy, reach, progress);
  const onScreen = progress < 0.97;

  if ((cues.exit > 0.04 || cues.grave > 0.15) && progress > 0.2) {
    ctx.save();
    ctx.strokeStyle = `rgba(186, 168, 150, ${0.08 + cues.exit * 0.18 + cues.grave * 0.08})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    const from = Math.max(0, progress - 0.28);
    const start = holePoint(cx, cy, reach, from);
    ctx.moveTo(start.x, start.y);
    for (let step = 1; step <= 8; step += 1) {
      const point = holePoint(cx, cy, reach, lerp(from, Math.min(progress, 0.96), step / 8));
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (cues.lens > 0.05 && onScreen) {
    const ring = reach * (0.04 + cues.lens * 0.055);
    ctx.strokeStyle = `rgba(255, 244, 220, ${0.28 * cues.lens})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, ring, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 220, 170, ${0.16 * cues.lens})`;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, ring * 1.45, 0, TAU);
    ctx.stroke();
  }

  const disk = Math.max(cues.theft, cues.drain * 0.85, cues.exit * 0.4) * (onScreen ? 1 : 0);
  if (disk > 0.04) {
    ctx.save();
    ctx.translate(hole.x, hole.y);
    ctx.rotate(time * 1.6);
    ctx.scale(1, 0.4);
    const glow = ctx.createRadialGradient(0, 0, reach * 0.01, 0, 0, reach * 0.11);
    glow.addColorStop(0, `rgba(255, 236, 200, ${0.15 * disk})`);
    glow.addColorStop(0.45, `rgba(255, 140, 40, ${0.55 * disk})`);
    glow.addColorStop(1, 'rgba(255, 60, 10, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, reach * 0.11, reach * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 210, 140, ${0.45 * disk})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, reach * 0.07, reach * 0.07, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  if (earth && cues.shatter > 0.15) {
    const fall = cues.shatter;
    for (let index = 0; index < 18; index += 1) {
      const spin = time * 1.4 + index * 0.55;
      const dist = lerp(reach * 0.08, reach * 0.012, fall) * (0.35 + (index % 5) * 0.12);
      const px = lerp(earth.x, hole.x, fall * 0.85) + Math.cos(spin) * dist;
      const py = lerp(earth.y, hole.y, fall * 0.85) + Math.sin(spin) * dist * 0.6;
      const alpha = (1 - cues.grave) * Math.sin(Math.min(1, fall) * Math.PI);
      ctx.fillStyle = `rgba(255, ${90 + (index % 4) * 28}, 40, ${0.75 * alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.7, 0, TAU);
      ctx.fill();
    }
  }

  if (cues.drain > 0.06 && onScreen) {
    const bridge = ctx.createLinearGradient(cx, cy, hole.x, hole.y);
    bridge.addColorStop(0, `rgba(255, 220, 140, ${0.15 * cues.drain})`);
    bridge.addColorStop(0.5, `rgba(255, 244, 220, ${0.85 * cues.drain})`);
    bridge.addColorStop(1, `rgba(255, 120, 40, ${0.2 * cues.drain})`);
    ctx.strokeStyle = bridge;
    ctx.lineWidth = 2 + cues.drain * 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo((cx + hole.x) / 2, (cy + hole.y) / 2 - reach * 0.04, hole.x, hole.y);
    ctx.stroke();
  }

  if (cues.jets > 0.05 && onScreen) {
    const len = reach * 0.28 * cues.jets;
    const angle = -0.9;
    ctx.save();
    ctx.translate(hole.x, hole.y);
    ctx.rotate(angle);
    const jet = ctx.createLinearGradient(0, 0, 0, -len);
    jet.addColorStop(0, `rgba(255, 250, 240, ${0.9 * cues.jets})`);
    jet.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.strokeStyle = jet;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, len * 0.15);
    ctx.lineTo(0, -len);
    ctx.moveTo(0, -len * 0.15);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
  }

  if (onScreen && progress > 0.08) {
    const radius = Math.max(4.5, reach * 0.011);
    ctx.fillStyle = '#010104';
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 236, 210, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, radius + 1.4, 0, TAU);
    ctx.stroke();
  }

  if (cues.grave > 0.02) {
    ctx.fillStyle = `rgba(2, 6, 16, ${cues.grave * 0.42})`;
    ctx.fillRect(0, 0, width, height);
  }
}

export function paintDrainedSun(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, width, height);
  const x = width / 2;
  const y = height / 2;
  const radius = Math.min(width, height) * 0.16;
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.4);
  glow.addColorStop(0, 'rgba(180, 40, 16, 0.45)');
  glow.addColorStop(1, 'rgba(80, 10, 4, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.4, 0, TAU);
  ctx.fill();
  const body = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.25, radius * 0.1, x, y, radius);
  body.addColorStop(0, '#a33a22');
  body.addColorStop(0.55, '#6c140c');
  body.addColorStop(1, '#2a0604');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}
