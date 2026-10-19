export type ClothMode = 'poke' | 'wind' | 'pulse';

const COLS = 56;
const ROWS = 34;

let cols = COLS;
let rows = ROWS;
let pos: Float32Array | null = null;
let vel: Float32Array | null = null;
let previousTime = -1;
let width = 0;
let height = 0;
let mode: ClothMode = 'poke';
let pulseClock = 0;
let pointerX = 0;
let pointerY = 0;
let pointerActive = false;
let pointerPrevX = 0;
let pointerPrevY = 0;

function index(x: number, y: number) {
  return y * cols + x;
}

function ensureField(w: number, h: number) {
  const nextCols = Math.max(24, Math.min(72, Math.round(w / 18)));
  const nextRows = Math.max(16, Math.min(44, Math.round(h / 18)));
  if (pos && width === w && height === h && cols === nextCols && rows === nextRows) return;
  width = w;
  height = h;
  cols = nextCols;
  rows = nextRows;
  const count = cols * rows;
  pos = new Float32Array(count);
  vel = new Float32Array(count);
  previousTime = -1;
  pulseClock = 0;
}

export function setClothPointer(x: number, y: number, active: boolean) {
  if (!active) {
    pointerActive = false;
    return;
  }
  if (!pointerActive) {
    pointerPrevX = x;
    pointerPrevY = y;
  } else {
    pointerPrevX = pointerX;
    pointerPrevY = pointerY;
  }
  pointerX = x;
  pointerY = y;
  pointerActive = true;
}

export function setClothMode(next: ClothMode) {
  mode = next;
}

export function getClothMode() {
  return mode;
}

export function calmCloth() {
  if (!pos || !vel) return;
  pos.fill(0);
  vel.fill(0);
  pulseClock = 0;
}

export function strikeCloth(x: number, y: number) {
  disturb(x, y, 52, 42);
}

function disturb(cx: number, cy: number, strength: number, radius: number) {
  if (!pos || !vel) return;
  const cellW = width / (cols - 1);
  const cellH = height / (rows - 1);
  const gx = cx / cellW;
  const gy = cy / cellH;
  const reach = radius / ((cellW + cellH) * 0.5);
  const r2 = reach * reach;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = x - gx;
      const dy = y - gy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const falloff = 1 - d2 / r2;
      vel[index(x, y)] += strength * falloff * falloff;
    }
  }
}

function step(dt: number) {
  if (!pos || !vel) return;
  pulseClock += dt;

  if (pointerActive && (mode === 'wind' || mode === 'poke')) {
    const dx = pointerX - pointerPrevX;
    const dy = pointerY - pointerPrevY;
    const swipe = Math.hypot(dx, dy);
    if (mode === 'wind') {
      disturb(pointerX, pointerY, 14 + swipe * 2.2, 56);
    } else if (swipe > 0.5) {
      disturb(pointerX, pointerY, 28 + swipe * 3.5, 38);
    }
  } else if (mode === 'pulse') {
    if (pulseClock > 1.35) {
      pulseClock = 0;
      const px = pointerActive ? pointerX : width * 0.5;
      const py = pointerActive ? pointerY : height * 0.5;
      disturb(px, py, 70, 48);
    }
  }

  const tension = 48;
  const damping = 0.985;
  const nextPos = new Float32Array(pos.length);
  const nextVel = new Float32Array(vel.length);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = index(x, y);
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        nextPos[i] = 0;
        nextVel[i] = 0;
        continue;
      }
      const lap = pos[index(x - 1, y)] + pos[index(x + 1, y)] + pos[index(x, y - 1)] + pos[index(x, y + 1)] - 4 * pos[i];
      let v = (vel[i] + lap * tension * dt) * damping;
      let p = pos[i] + v * dt;
      if (p > 28) { p = 28; v *= 0.4; }
      if (p < -28) { p = -28; v *= 0.4; }
      nextPos[i] = p;
      nextVel[i] = v;
    }
  }

  pos = nextPos;
  vel = nextVel;
}

function sampleColor(heightValue: number, energy: number) {
  const t = Math.min(1, Math.abs(heightValue) / 16);
  const e = Math.min(1, Math.abs(energy) / 20);
  if (heightValue >= 0) {
    const r = Math.round(90 + t * 40 + e * 40);
    const g = Math.round(150 + t * 60);
    const b = Math.round(170 + t * 50);
    return `rgba(${r}, ${g}, ${b}, ${0.35 + t * 0.45})`;
  }
  const r = Math.round(70 + t * 30);
  const g = Math.round(100 + t * 40);
  const b = Math.round(140 + t * 70 + e * 30);
  return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.4})`;
}

export function paintCloth(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  time: number,
  reduced: boolean,
) {
  if (viewWidth < 2 || viewHeight < 2) return;
  ensureField(viewWidth, viewHeight);
  if (!pos || !vel) return;

  const fresh = previousTime < 0 || time + 0.001 < previousTime;
  const dt = fresh ? 0 : Math.min(0.033, time - previousTime);
  previousTime = time;
  if (!reduced && dt > 0) {
    const steps = dt > 0.02 ? 2 : 1;
    for (let i = 0; i < steps; i += 1) step(dt / steps);
  }

  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const cellW = viewWidth / (cols - 1);
  const cellH = viewHeight / (rows - 1);

  ctx.lineWidth = 1;
  for (let y = 0; y < rows; y += 1) {
    ctx.beginPath();
    for (let x = 0; x < cols; x += 1) {
      const i = index(x, y);
      const lift = pos[i];
      const px = x * cellW;
      const py = y * cellH - lift * 1.15;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const mid = pos[index(Math.floor(cols / 2), y)] ?? 0;
    ctx.strokeStyle = sampleColor(mid, vel[index(Math.floor(cols / 2), y)] ?? 0);
    ctx.stroke();
  }

  for (let x = 0; x < cols; x += 1) {
    ctx.beginPath();
    for (let y = 0; y < rows; y += 1) {
      const i = index(x, y);
      const lift = pos[i];
      const px = x * cellW;
      const py = y * cellH - lift * 1.15;
      if (y === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const mid = pos[index(x, Math.floor(rows / 2))] ?? 0;
    ctx.strokeStyle = sampleColor(mid, vel[index(x, Math.floor(rows / 2))] ?? 0);
    ctx.stroke();
  }

  if (pointerActive) {
    const glow = ctx.createRadialGradient(pointerX, pointerY, 2, pointerX, pointerY, 46);
    glow.addColorStop(0, mode === 'wind' ? 'rgba(154, 246, 238, 0.22)' : 'rgba(232, 196, 120, 0.24)');
    glow.addColorStop(1, 'rgba(10, 16, 24, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 46, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function resetClothClock() {
  previousTime = -1;
}
