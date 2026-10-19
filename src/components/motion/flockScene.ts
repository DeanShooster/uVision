export type FlockMode = 'attract' | 'flee';

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Pointer = {
  x: number;
  y: number;
  active: boolean;
};

const COUNT = 440;
const MAX_SPEED = 210;
const MIN_SPEED = 55;
const PERCEPTION = 54;
const SEPARATION_DIST = 22;
export const COLOR_INTERVAL = 10;
export const PALETTE = [
  '#9af6ee',
  '#e2b46a',
  '#e15a38',
  '#7eb8ff',
  '#d6e36a',
] as const;

let birds: Bird[] | null = null;
let previousTime = -1;
let width = 0;
let height = 0;
let mode: FlockMode = 'attract';
const pointer: Pointer = { x: 0, y: 0, active: false };

function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function spawn(w: number, h: number) {
  const next: Bird[] = [];
  for (let index = 0; index < COUNT; index += 1) {
    const angle = hash(index * 17 + 3) * Math.PI * 2;
    const speed = MIN_SPEED + hash(index * 9 + 1) * (MAX_SPEED - MIN_SPEED) * 0.45;
    next.push({
      x: hash(index * 5 + 2) * w,
      y: hash(index * 11 + 7) * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return next;
}

export function setFlockPointer(x: number, y: number, active: boolean) {
  pointer.x = x;
  pointer.y = y;
  pointer.active = active;
}

export function setFlockMode(next: FlockMode) {
  mode = next;
}

export function getFlockMode() {
  return mode;
}

export function scatterFlock() {
  if (!birds) return;
  birds.forEach((bird, index) => {
    const angle = hash(index * 31 + performance.now()) * Math.PI * 2;
    const burst = MAX_SPEED * (0.85 + hash(index + 4) * 0.4);
    bird.vx = Math.cos(angle) * burst;
    bird.vy = Math.sin(angle) * burst;
  });
}

function limit(vx: number, vy: number, max: number) {
  const speed = Math.hypot(vx, vy);
  if (speed <= max || speed < 0.001) return { vx, vy };
  const scale = max / speed;
  return { vx: vx * scale, vy: vy * scale };
}

function wrap(bird: Bird, w: number, h: number) {
  const margin = 16;
  if (bird.x < -margin) bird.x = w + margin;
  if (bird.x > w + margin) bird.x = -margin;
  if (bird.y < -margin) bird.y = h + margin;
  if (bird.y > h + margin) bird.y = -margin;
}

function step(dt: number, w: number, h: number) {
  if (!birds) return;
  const cell = PERCEPTION;
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(h / cell));
  const buckets = new Map<number, number[]>();

  birds.forEach((bird, index) => {
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(bird.x / cell)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(bird.y / cell)));
    const key = cy * cols + cx;
    const list = buckets.get(key);
    if (list) list.push(index);
    else buckets.set(key, [index]);
  });

  const next = birds.map((bird) => ({ ...bird }));

  birds.forEach((bird, index) => {
    let sepX = 0;
    let sepY = 0;
    let alignX = 0;
    let alignY = 0;
    let cohX = 0;
    let cohY = 0;
    let total = 0;
    let separate = 0;

    const cx = Math.min(cols - 1, Math.max(0, Math.floor(bird.x / cell)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(bird.y / cell)));

    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        const nx = cx + ox;
        const ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const neighbors = buckets.get(ny * cols + nx);
        if (!neighbors) continue;
        neighbors.forEach((otherIndex) => {
          if (otherIndex === index) return;
          const other = birds![otherIndex];
          const dx = bird.x - other.x;
          const dy = bird.y - other.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0 || dist > PERCEPTION) return;
          total += 1;
          alignX += other.vx;
          alignY += other.vy;
          cohX += other.x;
          cohY += other.y;
          if (dist < SEPARATION_DIST) {
            separate += 1;
            const force = (SEPARATION_DIST - dist) / SEPARATION_DIST;
            sepX += (dx / dist) * force;
            sepY += (dy / dist) * force;
          }
        });
      }
    }

    let ax = 0;
    let ay = 0;
    if (separate > 0) {
      ax += (sepX / separate) * 320;
      ay += (sepY / separate) * 320;
    }
    if (total > 0) {
      ax += (alignX / total - bird.vx) * 1.35;
      ay += (alignY / total - bird.vy) * 1.35;
      ax += ((cohX / total - bird.x) * 0.9);
      ay += ((cohY / total - bird.y) * 0.9);
    }

    if (pointer.active) {
      const dx = pointer.x - bird.x;
      const dy = pointer.y - bird.y;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = mode === 'attract' ? 280 : 210;
      if (dist < reach) {
        const strength = mode === 'attract'
          ? 140 * (1 - dist / reach)
          : -260 * (1 - dist / reach);
        ax += (dx / dist) * strength;
        ay += (dy / dist) * strength;
      }
    }

    let vx = bird.vx + ax * dt;
    let vy = bird.vy + ay * dt;
    const capped = limit(vx, vy, MAX_SPEED);
    vx = capped.vx;
    vy = capped.vy;
    const speed = Math.hypot(vx, vy);
    if (speed < MIN_SPEED && speed > 0.001) {
      vx = (vx / speed) * MIN_SPEED;
      vy = (vy / speed) * MIN_SPEED;
    }

    const moved = next[index];
    moved.vx = vx;
    moved.vy = vy;
    moved.x = bird.x + vx * dt;
    moved.y = bird.y + vy * dt;
    wrap(moved, w, h);
  });

  birds = next;
}

function flockColor(time: number) {
  const index = Math.floor(Math.max(0, time) / COLOR_INTERVAL) % PALETTE.length;
  return PALETTE[index];
}

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird, color: string) {
  const angle = Math.atan2(bird.vy, bird.vx);
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(7.5, 0);
  ctx.lineTo(-5.5, 3.6);
  ctx.lineTo(-3.2, 0);
  ctx.lineTo(-5.5, -3.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function paintFlock(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  time: number,
  reduced: boolean,
) {
  if (viewWidth < 2 || viewHeight < 2) return;
  const resized = !birds || width !== viewWidth || height !== viewHeight;
  if (resized) {
    width = viewWidth;
    height = viewHeight;
    birds = spawn(viewWidth, viewHeight);
    previousTime = -1;
  }

  const fresh = previousTime < 0 || time + 0.001 < previousTime;
  const dt = fresh ? 0 : Math.min(0.033, time - previousTime);
  previousTime = time;
  if (!reduced && dt > 0) step(dt, viewWidth, viewHeight);

  ctx.fillStyle = fresh || resized || reduced ? '#0a0e14' : 'rgba(10, 14, 20, 0.18)';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  if (pointer.active) {
    const glow = ctx.createRadialGradient(pointer.x, pointer.y, 2, pointer.x, pointer.y, mode === 'flee' ? 70 : 90);
    glow.addColorStop(0, mode === 'flee' ? 'rgba(225, 90, 56, 0.28)' : 'rgba(154, 246, 238, 0.22)');
    glow.addColorStop(1, 'rgba(10, 14, 20, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, mode === 'flee' ? 70 : 90, 0, Math.PI * 2);
    ctx.fill();
  }

  const color = flockColor(time);
  birds?.forEach((bird) => drawBird(ctx, bird, color));
}

export function resetFlockClock() {
  previousTime = -1;
}
