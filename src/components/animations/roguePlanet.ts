const TAU = Math.PI * 2;
const TILT = 0.56;
const FLUNG_PERIOD = 32;
let flungEpoch: number | null = null;

function flungSpin(time: number, choice: number) {
  if (choice < 1) {
    flungEpoch = null;
    return 0;
  }
  if (flungEpoch === null) flungEpoch = time;
  return ((time - flungEpoch) / FLUNG_PERIOD) * TAU;
}

export const ROGUE_MARKS = [0, 0.22, 0.45, 0.68];
export const ROGUE_SECONDS = 28;
export const ROGUE_END_SECONDS = 14;

export type RogueEnding = 'eject' | 'capture' | 'star';

export type SceneClock = {
  sun: number;
  rogue: number;
  ending: RogueEnding | null;
  choice: number;
  hole: number;
};

export function stillClock(sun = 0): SceneClock {
  return { sun, rogue: 0, ending: null, choice: 0, hole: 0 };
}

export function readClock(epoch: number | SceneClock = 0): SceneClock {
  return typeof epoch === 'number' ? stillClock(epoch) : epoch;
}

export function rogueBeat(progress: number) {
  let index = 0;
  ROGUE_MARKS.forEach((mark, markIndex) => {
    if (progress >= mark) index = markIndex;
  });
  return index;
}

export type RogueFocus = 'present' | 'rogue' | 'sun' | 'belt' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export function rogueFocus(kind: string, clock: SceneClock): RogueFocus {
  if (clock.rogue <= 0 || clock.choice < 0.82 || !clock.ending) return 'present';
  if (kind === 'rogue') return clock.ending === 'capture' ? 'rogue' : 'present';
  if (kind === 'mars' && clock.ending === 'eject') return 'present';
  if (kind === 'sun' || kind === 'earth' || kind === 'mars' || kind === 'belt' || kind === 'mercury' || kind === 'venus' || kind === 'jupiter' || kind === 'saturn' || kind === 'uranus' || kind === 'neptune') {
    return kind;
  }
  return 'present';
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

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export type RogueCues = {
  enter: number;
  debris: number;
  bend: number;
  snap: number;
  impact: number;
  flash: number;
  shake: number;
  leave: number;
  settle: number;
  plunge: number;
  cme: number;
};

export function rogueCues(clock: SceneClock): RogueCues {
  const progress = clock.rogue;
  const choice = clock.ending ? clock.choice : 0;
  const eject = clock.ending === 'eject' ? choice : 0;
  const capture = clock.ending === 'capture' ? choice : 0;
  const star = clock.ending === 'star' ? choice : 0;
  const flash = clock.ending === 'eject'
    ? Math.sin(clamp01((choice - 0.08) / 0.3) * Math.PI)
    : clock.ending === 'star'
      ? Math.sin(clamp01((choice - 0.22) / 0.36) * Math.PI)
      : 0;
  return {
    enter: between(progress, 0.02, 0.2),
    debris: between(progress, 0.18, 0.34) * (1 - between(progress, 0.72, 0.9) * 0.55),
    bend: between(progress, 0.4, 0.62),
    snap: between(progress, 0.64, 0.9),
    impact: eject,
    flash,
    shake: flash,
    leave: eject,
    settle: capture,
    plunge: star,
    cme: between(star, 0.32, 0.7),
  };
}

type Point = { x: number; y: number };

function pathEnds(cx: number, cy: number, reach: number) {
  return {
    entry: { x: cx + reach * 1.22, y: cy - reach * 0.46 },
    inner: { x: cx + reach * 0.2, y: cy - reach * 0.04 },
    exit: { x: cx - reach * 1.12, y: cy + reach * 0.46 },
  };
}

function capturePoint(cx: number, cy: number, reach: number, choice: number, time: number, inner: Point) {
  const angle = lerp(-0.2, 1.15, Math.min(1, choice * 1.15)) + (choice >= 0.98 ? time * 0.12 : 0);
  const rx = reach * 0.8;
  const ry = reach * 0.32;
  const rot = -0.62;
  const localX = Math.cos(angle) * rx;
  const localY = Math.sin(angle) * ry;
  const x = cx + localX * Math.cos(rot) - localY * Math.sin(rot);
  const y = cy + (localX * Math.sin(rot) + localY * Math.cos(rot)) * 0.72;
  const settle = smooth(Math.min(1, choice / 0.72));
  return { x: lerp(inner.x, x, settle), y: lerp(inner.y, y, settle), rx, ry, rot };
}

export function rogueBody(cx: number, cy: number, reach: number, clock: SceneClock, time: number) {
  if (clock.rogue <= 0) return null;
  const cues = rogueCues(clock);
  const ends = pathEnds(cx, cy, reach);
  let point = {
    x: lerp(ends.entry.x, ends.inner.x, smooth(Math.min(1, clock.rogue / 0.92))),
    y: lerp(ends.entry.y, ends.inner.y, smooth(Math.min(1, clock.rogue / 0.92))),
  };
  if (clock.ending === 'eject') point = { x: lerp(ends.inner.x, ends.exit.x, smooth(clock.choice)), y: lerp(ends.inner.y, ends.exit.y, smooth(clock.choice)) };
  if (clock.ending === 'star') {
    const dive = smooth(clock.choice / 0.55);
    point = { x: lerp(ends.inner.x, cx, dive), y: lerp(ends.inner.y, cy, dive) };
    if (clock.choice > 0.62) return null;
  }
  if (clock.ending === 'capture') point = capturePoint(cx, cy, reach, clock.choice, time, ends.inner);
  const radius = Math.max(15, reach * 0.036) * lerp(0.45, 1, Math.max(cues.enter, clock.rogue > 0.2 ? 1 : 0));
  return { ...point, radius, ends };
}

export type RogueShift = {
  x: number;
  y: number;
  orbitCx: number;
  orbitCy: number;
  orbitRx: number;
  orbitFade: number;
  gone: boolean;
  companions: number;
  frost: number;
  scorch: number;
};

export function shiftBody(
  kind: string,
  x: number,
  y: number,
  angle: number,
  orbitPx: number,
  cx: number,
  cy: number,
  reach: number,
  clock: SceneClock,
  time = 0,
): RogueShift {
  const base: RogueShift = {
    x,
    y,
    orbitCx: cx,
    orbitCy: cy,
    orbitRx: orbitPx,
    orbitFade: 0,
    gone: false,
    companions: 1,
    frost: 0,
    scorch: 0,
  };
  if (clock.rogue <= 0) return base;
  const cues = rogueCues(clock);
  let nextX = x;
  let nextY = y;
  let orbitCx = cx;
  let orbitCy = cy;
  let orbitRx = orbitPx;
  let orbitFade = 0;
  let companions = 1;
  let frost = 0;
  let scorch = 0;
  let gone = false;
  const mix = (tx: number, ty: number, amount: number) => {
    nextX = lerp(nextX, tx, amount);
    nextY = lerp(nextY, ty, amount);
  };
  if (kind === 'neptune') {
    orbitCx = cx + reach * 0.1 * cues.bend;
    orbitCy = cy - reach * 0.04 * cues.bend;
    orbitRx = orbitPx * lerp(1, 1.16, cues.bend);
    mix(orbitCx + Math.cos(angle) * orbitRx, orbitCy + Math.sin(angle) * orbitRx * 0.56, cues.bend);
    companions = 1 - cues.bend;
  }
  if (kind === 'uranus') {
    orbitCx = cx + reach * 0.06 * cues.bend;
    orbitCy = cy + reach * 0.03 * cues.bend;
    orbitRx = orbitPx * lerp(1, 1.1, cues.bend);
    mix(orbitCx + Math.cos(angle) * orbitRx, orbitCy + Math.sin(angle) * orbitRx * 0.56, cues.bend);
    companions = 1 - cues.bend * 0.85;
  }
  if (kind === 'saturn' || kind === 'jupiter') {
    const pull = kind === 'saturn' ? 0.16 : 0.1;
    orbitCx = cx + reach * pull * cues.bend;
    orbitRx = orbitPx * lerp(1, 1.08, cues.bend);
    mix(orbitCx + Math.cos(angle) * orbitRx, cy + Math.sin(angle) * orbitRx * 0.56, cues.bend);
    companions = 1 - cues.bend;
  }
  if (kind === 'earth') {
    orbitFade = cues.snap * 0.8;
    mix(cx - reach * 0.28, cy - reach * 0.22, cues.snap * 0.55);
    if (clock.ending === 'eject') {
      const farX = -reach * 0.7;
      const farY = -reach * 0.34;
      const rx = Math.hypot(farX, farY / TILT);
      const arrival = Math.atan2(farY / TILT, farX);
      const angle = arrival + flungSpin(time, clock.choice);
      const travel = smooth(clock.choice);
      mix(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * rx * TILT, travel);
      frost = travel;
      orbitCx = cx;
      orbitCy = cy;
      orbitRx = rx;
      orbitFade = 1 - travel;
    }
    if (clock.ending === 'capture') mix(cx + reach * 0.36, cy + reach * 0.1, smooth(clock.choice) * 0.65);
    if (clock.ending === 'star') scorch = smooth(Math.max(0, clock.choice - 0.35) / 0.65);
  }
  if (kind === 'mars') {
    orbitFade = cues.snap * 0.7;
    mix(cx + reach * 0.34, cy - reach * 0.12, cues.snap * 0.4);
    if (clock.ending === 'eject') {
      const ends = pathEnds(cx, cy, reach);
      const hit = { x: lerp(ends.inner.x, ends.exit.x, 0.22), y: lerp(ends.inner.y, ends.exit.y, 0.22) };
      mix(hit.x, hit.y, smooth(Math.min(1, clock.choice / 0.28)));
      gone = clock.choice > 0.34;
    }
  }
  if (kind === 'venus') {
    orbitFade = cues.snap * 0.65;
    mix(cx + reach * 0.08, cy + reach * 0.06, cues.snap * 0.7);
  }
  if (kind === 'mercury') {
    orbitFade = cues.snap * 0.55;
    mix(cx - reach * 0.06, cy + reach * 0.08, cues.snap * 0.45);
  }
  return { x: nextX, y: nextY, orbitCx, orbitCy, orbitRx, orbitFade, gone, companions, frost, scorch };
}

export function rogueShake(clock: SceneClock) {
  return rogueCues(clock).shake;
}

function strokeTrail(ctx: CanvasRenderingContext2D, from: Point, to: Point, alpha: number, width: number, dash: boolean) {
  ctx.save();
  ctx.strokeStyle = `rgba(242, 180, 39, ${alpha})`;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function drawRogueUnder(
  ctx: CanvasRenderingContext2D,
  time: number,
  cx: number,
  cy: number,
  reach: number,
  clock: SceneClock,
) {
  if (clock.rogue <= 0) return;
  const cues = rogueCues(clock);
  const body = rogueBody(cx, cy, reach, clock, time);
  const ends = pathEnds(cx, cy, reach);
  const head = body ?? ends.inner;
  const inbound = clock.ending === 'capture' || clock.ending === 'star' ? 1 - smooth(clock.choice) : 1;
  const trailFade = clock.ending === 'eject' ? 1 - between(clock.choice, 0.78, 1) : inbound;
  if (trailFade > 0.02) strokeTrail(ctx, ends.entry, head, (0.35 + cues.enter * 0.5) * trailFade, 2.4, false);
  if (clock.ending !== 'star' && clock.ending !== 'capture' && trailFade > 0.02) {
    strokeTrail(ctx, head, ends.exit, 0.45 * trailFade, 1.6, true);
  }
  if (clock.ending === 'capture' && clock.choice > 0.12) {
    const sample = capturePoint(cx, cy, reach, 1, 0, ends.inner);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sample.rot);
    ctx.strokeStyle = `rgba(214, 122, 74, ${0.25 + clock.choice * 0.55})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, sample.rx, sample.ry, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  if (cues.debris > 0.04) {
    for (let index = 0; index < 18; index += 1) {
      const fall = (clock.rogue * 1.3 + index * 0.055) % 1;
      const angle = index * 0.7 + fall * (index % 2 === 0 ? 0.8 : -0.5);
      const radius = lerp(reach * (1.02 + (index % 3) * 0.03), reach * (0.25 + (index % 4) * 0.08), fall);
      const headX = cx + Math.cos(angle) * radius;
      const headY = cy + Math.sin(angle) * radius * 0.56 + Math.sin(index) * 16;
      const tailX = cx + Math.cos(angle) * (radius + reach * 0.07);
      const tailY = cy + Math.sin(angle) * (radius + reach * 0.07) * 0.56;
      const alpha = cues.debris * Math.sin(fall * Math.PI) * 0.8;
      ctx.strokeStyle = `rgba(186, 214, 255, ${alpha})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.fillStyle = `rgba(240, 248, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(headX, headY, 1.6, 0, TAU);
      ctx.fill();
    }
  }
}

type CourseBody = { kind: string; x: number; y: number; homeX: number; homeY: number };

export function drawRogueCourses(ctx: CanvasRenderingContext2D, clock: SceneClock, bodies: CourseBody[]) {
  const cues = rogueCues(clock);
  if (cues.snap < 0.08) return;
  const fade = clock.ending ? 1 - between(clock.choice, 0.78, 1) : 1;
  if (fade < 0.02) return;
  const inner = new Set(['mercury', 'venus', 'earth', 'mars']);
  ctx.save();
  ctx.strokeStyle = `rgba(232, 154, 92, ${(0.3 + cues.snap * 0.5) * fade})`;
  ctx.lineWidth = 1.2;
  bodies.forEach((body) => {
    if (!inner.has(body.kind)) return;
    const midX = (body.homeX + body.x) / 2 + (body.y - body.homeY) * 0.35;
    const midY = (body.homeY + body.y) / 2 - (body.x - body.homeX) * 0.35;
    ctx.beginPath();
    ctx.moveTo(body.homeX, body.homeY);
    ctx.quadraticCurveTo(midX, midY, body.x, body.y);
    ctx.stroke();
  });
  ctx.restore();
}

function paintRogueSphere(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.8);
  glow.addColorStop(0, 'rgba(255, 150, 90, 0.28)');
  glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.8, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.clip();
  const body = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
  body.addColorStop(0, '#e7a07a');
  body.addColorStop(0.45, '#b55238');
  body.addColorStop(1, '#5c2418');
  ctx.fillStyle = body;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ['#8a3a28', '#d47858', '#6e2c22'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(-radius * 1.2, -radius * 0.42 + index * radius * 0.32, radius * 2.4, radius * (0.1 + index * 0.03));
  });
  const spin = ((time * 0.08) % 1 + 1) % 1;
  ctx.fillStyle = 'rgba(92, 28, 18, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-radius + spin * radius * 2, radius * 0.08, radius * 0.2, radius * 0.1, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  const shade = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  shade.addColorStop(0, 'rgba(2, 6, 16, 0.55)');
  shade.addColorStop(0.55, 'rgba(2, 6, 16, 0)');
  shade.addColorStop(1, 'rgba(255, 236, 210, 0.12)');
  ctx.fillStyle = shade;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

export function drawRogueOver(
  ctx: CanvasRenderingContext2D,
  time: number,
  cx: number,
  cy: number,
  reach: number,
  clock: SceneClock,
  mars: { x: number; y: number } | null,
) {
  if (clock.rogue <= 0) return;
  const cues = rogueCues(clock);
  const body = rogueBody(cx, cy, reach, clock, time);
  if (clock.ending === 'eject' && mars && clock.choice > 0.2 && clock.choice < 0.85) {
    const spread = reach * (0.04 + clock.choice * 0.12);
    for (let index = 0; index < 16; index += 1) {
      const angle = index / 16 * TAU + time * 0.4;
      const dist = spread * (0.35 + (index % 5) * 0.12);
      ctx.fillStyle = `rgba(255, ${120 + (index % 3) * 30}, 60, ${0.75 * (1 - clock.choice)})`;
      ctx.beginPath();
      ctx.arc(mars.x + Math.cos(angle) * dist, mars.y + Math.sin(angle) * dist * 0.6, 1.8, 0, TAU);
      ctx.fill();
    }
  }
  if (body) {
    paintRogueSphere(ctx, body.x, body.y, body.radius, time);
    if (clock.ending === 'eject' && clock.choice > 0.4) {
      const behind = 18 + clock.choice * 20;
      ctx.fillStyle = `rgba(200, 198, 190, ${0.8})`;
      ctx.beginPath();
      ctx.arc(body.x + 22, body.y - behind * 0.3, 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.font = '600 12px Figtree, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(236, 228, 214, 0.88)';
    ctx.fillText(clock.ending === 'capture' && clock.choice > 0.7 ? 'Rogue' : 'Rogue', body.x + body.radius + 8, body.y - body.radius * 0.2);
  }
  if (cues.flash > 0.05) {
    const at = body ?? { x: cx, y: cy };
    const flash = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, reach * 0.45);
    flash.addColorStop(0, `rgba(255, 250, 240, ${0.85 * cues.flash})`);
    flash.addColorStop(0.25, `rgba(255, 170, 70, ${0.45 * cues.flash})`);
    flash.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(at.x, at.y, reach * 0.45, 0, TAU);
    ctx.fill();
  }
  if (cues.cme > 0.02) {
    const ring = reach * (0.12 + cues.cme * 0.95);
    ctx.strokeStyle = `rgba(255, 196, 110, ${(1 - cues.cme) * 0.75})`;
    ctx.lineWidth = 8 * (1 - cues.cme) + 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ring, 0, TAU);
    ctx.stroke();
    const hotter = ctx.createRadialGradient(cx, cy, reach * 0.02, cx, cy, reach * 0.2);
    hotter.addColorStop(0, `rgba(255, 236, 200, ${0.35 * cues.cme})`);
    hotter.addColorStop(1, 'rgba(255, 180, 60, 0)');
    ctx.fillStyle = hotter;
    ctx.beginPath();
    ctx.arc(cx, cy, reach * 0.2, 0, TAU);
    ctx.fill();
  }
}

export function paintRoguePortrait(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, width, height);
  paintRogueSphere(ctx, width / 2, height * 0.44, Math.min(width, height) * 0.22, time);
}

export function paintHeavierSun(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const x = width / 2;
  const y = height / 2;
  const reach = Math.min(width, height);
  const glow = ctx.createRadialGradient(x, y, reach * 0.05, x, y, reach * 0.48);
  glow.addColorStop(0, 'rgba(255, 236, 190, 0.35)');
  glow.addColorStop(1, 'rgba(255, 160, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, reach * 0.48, 0, TAU);
  ctx.fill();
}
