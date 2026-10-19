import { useEffect, useRef } from 'react';
import { MOTION_PREVIEW } from '../../constants/ui';
import { canvasPixelRatio } from '../../hooks/useCanvasLoop';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { COLOR_INTERVAL, PALETTE } from './flockScene';

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const COUNT = MOTION_PREVIEW.flockCount;
const MAX_SPEED = MOTION_PREVIEW.flockMaxSpeed;
const MIN_SPEED = MOTION_PREVIEW.flockMinSpeed;
const VIEW_W = MOTION_PREVIEW.width;
const VIEW_H = MOTION_PREVIEW.height;

function spawn() {
  return Array.from({ length: COUNT }, (_, index) => {
    const angle = (index / COUNT) * Math.PI * 2 + (index % 7) * 0.11;
    const radius = 18 + (index % 9) * 5.5;
    const speed = MIN_SPEED + (index % 5) * 6;
    return {
      x: VIEW_W * 0.5 + Math.cos(angle) * radius * 1.35,
      y: VIEW_H * 0.5 + Math.sin(angle) * radius * 0.72,
      vx: Math.cos(angle + 1.2) * speed,
      vy: Math.sin(angle + 1.2) * speed,
    } satisfies Bird;
  });
}

function limit(vx: number, vy: number, max: number) {
  const speed = Math.hypot(vx, vy);
  if (speed <= max || speed < 0.001) return { vx, vy };
  const scale = max / speed;
  return { vx: vx * scale, vy: vy * scale };
}

function wrap(bird: Bird) {
  const margin = 10;
  if (bird.x < -margin) bird.x = VIEW_W + margin;
  if (bird.x > VIEW_W + margin) bird.x = -margin;
  if (bird.y < -margin) bird.y = VIEW_H + margin;
  if (bird.y > VIEW_H + margin) bird.y = -margin;
}

function step(birds: Bird[], dt: number) {
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

    birds.forEach((other, otherIndex) => {
      if (otherIndex === index) return;
      const dx = bird.x - other.x;
      const dy = bird.y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0 || dist > 42) return;
      total += 1;
      alignX += other.vx;
      alignY += other.vy;
      cohX += other.x;
      cohY += other.y;
      if (dist < 14) {
        separate += 1;
        const force = (14 - dist) / 14;
        sepX += (dx / dist) * force;
        sepY += (dy / dist) * force;
      }
    });

    let ax = (VIEW_W * 0.5 - bird.x) * 0.35;
    let ay = (VIEW_H * 0.5 - bird.y) * 0.35;
    if (separate > 0) {
      ax += (sepX / separate) * 220;
      ay += (sepY / separate) * 220;
    }
    if (total > 0) {
      ax += (alignX / total - bird.vx) * 1.2;
      ay += (alignY / total - bird.vy) * 1.2;
      ax += (cohX / total - bird.x) * 0.8;
      ay += (cohY / total - bird.y) * 0.8;
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
    wrap(moved);
  });
  return next;
}

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird, color: string) {
  const angle = Math.atan2(bird.vy, bird.vx);
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(5.2, 0);
  ctx.lineTo(-3.8, 2.5);
  ctx.lineTo(-2.2, 0);
  ctx.lineTo(-3.8, -2.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function FlockPreview() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdsRef = useRef(spawn());
  const startedRef = useRef(0);
  const previousRef = useRef(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const dpr = canvasPixelRatio();
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    birdsRef.current = spawn();
    startedRef.current = performance.now();
    previousRef.current = -1;

    if (reduced) {
      context.fillStyle = '#0a0e14';
      context.fillRect(0, 0, VIEW_W, VIEW_H);
      const color = PALETTE[0];
      birdsRef.current.forEach((bird) => drawBird(context, bird, color));
      return undefined;
    }

    let frameId = 0;
    const tick = (now: number) => {
      const time = (now - startedRef.current) / 1000;
      const previous = previousRef.current;
      const dt = previous < 0 ? 0 : Math.min(0.033, (now - previous) / 1000);
      previousRef.current = now;
      if (dt > 0) birdsRef.current = step(birdsRef.current, dt);

      context.fillStyle = previous < 0 ? '#0a0e14' : 'rgba(10, 14, 20, 0.22)';
      context.fillRect(0, 0, VIEW_W, VIEW_H);

      const color = PALETTE[Math.floor(time / COLOR_INTERVAL) % PALETTE.length];
      birdsRef.current.forEach((bird) => drawBird(context, bird, color));
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="scene-art"
      width={VIEW_W}
      height={VIEW_H}
      aria-hidden="true"
    />
  );
}

const CLOTH_COLS = MOTION_PREVIEW.clothCols;
const CLOTH_ROWS = MOTION_PREVIEW.clothRows;

function ClothPreview() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef({
    pos: new Float32Array(CLOTH_COLS * CLOTH_ROWS),
    vel: new Float32Array(CLOTH_COLS * CLOTH_ROWS),
  });
  const previousRef = useRef(-1);
  const startedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const dpr = canvasPixelRatio();
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    fieldRef.current.pos.fill(0);
    fieldRef.current.vel.fill(0);
    previousRef.current = -1;
    startedRef.current = performance.now();

    const idx = (x: number, y: number) => y * CLOTH_COLS + x;

    const disturb = (cx: number, cy: number, strength: number) => {
      const cellW = VIEW_W / (CLOTH_COLS - 1);
      const cellH = VIEW_H / (CLOTH_ROWS - 1);
      const gx = cx / cellW;
      const gy = cy / cellH;
      for (let y = 1; y < CLOTH_ROWS - 1; y += 1) {
        for (let x = 1; x < CLOTH_COLS - 1; x += 1) {
          const dx = x - gx;
          const dy = y - gy;
          const d2 = dx * dx + dy * dy;
          if (d2 > 16) continue;
          fieldRef.current.vel[idx(x, y)] += strength * (1 - d2 / 16);
        }
      }
    };

    const paint = () => {
      const { pos, vel } = fieldRef.current;
      context.fillStyle = '#0a1018';
      context.fillRect(0, 0, VIEW_W, VIEW_H);
      const cellW = VIEW_W / (CLOTH_COLS - 1);
      const cellH = VIEW_H / (CLOTH_ROWS - 1);
      context.lineWidth = 1;
      for (let y = 0; y < CLOTH_ROWS; y += 1) {
        context.beginPath();
        for (let x = 0; x < CLOTH_COLS; x += 1) {
          const lift = pos[idx(x, y)];
          const px = x * cellW;
          const py = y * cellH - lift * 1.1;
          if (x === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        const mid = pos[idx(Math.floor(CLOTH_COLS / 2), y)];
        const t = Math.min(1, Math.abs(mid) / 10);
        context.strokeStyle = `rgba(${90 + t * 80}, ${160 + t * 40}, ${180}, ${0.35 + t * 0.4})`;
        context.stroke();
      }
      for (let x = 0; x < CLOTH_COLS; x += 1) {
        context.beginPath();
        for (let y = 0; y < CLOTH_ROWS; y += 1) {
          const lift = pos[idx(x, y)];
          const px = x * cellW;
          const py = y * cellH - lift * 1.1;
          if (y === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        const mid = pos[idx(x, Math.floor(CLOTH_ROWS / 2))];
        const t = Math.min(1, Math.abs(mid) / 10);
        context.strokeStyle = `rgba(${80 + t * 70}, ${140 + t * 50}, ${190}, ${0.3 + t * 0.35})`;
        context.stroke();
      }
      void vel;
    };

    if (reduced) {
      disturb(VIEW_W * 0.45, VIEW_H * 0.55, 8);
      for (let i = 0; i < 8; i += 1) {
        const { pos, vel } = fieldRef.current;
        const nextPos = new Float32Array(pos.length);
        const nextVel = new Float32Array(vel.length);
        for (let y = 0; y < CLOTH_ROWS; y += 1) {
          for (let x = 0; x < CLOTH_COLS; x += 1) {
            const iCell = idx(x, y);
            if (x === 0 || y === 0 || x === CLOTH_COLS - 1 || y === CLOTH_ROWS - 1) continue;
            const lap = pos[idx(x - 1, y)] + pos[idx(x + 1, y)] + pos[idx(x, y - 1)] + pos[idx(x, y + 1)] - 4 * pos[iCell];
            nextVel[iCell] = (vel[iCell] + lap * 40 * 0.016) * 0.98;
            nextPos[iCell] = pos[iCell] + nextVel[iCell] * 0.016;
          }
        }
        fieldRef.current.pos = nextPos;
        fieldRef.current.vel = nextVel;
      }
      paint();
      return undefined;
    }

    let frameId = 0;
    const tick = (now: number) => {
      const time = (now - startedRef.current) / 1000;
      const previous = previousRef.current;
      const dt = previous < 0 ? 0 : Math.min(0.033, (now - previous) / 1000);
      previousRef.current = now;
      if (dt > 0) {
        if (Math.floor(time * 1.4) !== Math.floor((time - dt) * 1.4)) {
          disturb(
            VIEW_W * (0.35 + 0.3 * Math.sin(time * 0.9)),
            VIEW_H * (0.4 + 0.25 * Math.cos(time * 1.1)),
            26,
          );
        }
        const { pos, vel } = fieldRef.current;
        const nextPos = new Float32Array(pos.length);
        const nextVel = new Float32Array(vel.length);
        for (let y = 0; y < CLOTH_ROWS; y += 1) {
          for (let x = 0; x < CLOTH_COLS; x += 1) {
            const iCell = idx(x, y);
            if (x === 0 || y === 0 || x === CLOTH_COLS - 1 || y === CLOTH_ROWS - 1) continue;
            const lap = pos[idx(x - 1, y)] + pos[idx(x + 1, y)] + pos[idx(x, y - 1)] + pos[idx(x, y + 1)] - 4 * pos[iCell];
            nextVel[iCell] = (vel[iCell] + lap * 48 * dt) * 0.985;
            nextPos[iCell] = pos[iCell] + nextVel[iCell] * dt;
          }
        }
        fieldRef.current.pos = nextPos;
        fieldRef.current.vel = nextVel;
      }
      paint();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="scene-art"
      width={VIEW_W}
      height={VIEW_H}
      aria-hidden="true"
    />
  );
}

export default function MotionPreview({ id }: { id: string }) {
  if (id === 'flock') return <FlockPreview />;
  if (id === 'cloth') return <ClothPreview />;
  return null;
}
