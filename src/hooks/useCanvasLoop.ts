import { useEffect, type RefObject } from 'react';
import { CANVAS_DPR_CAP } from '../constants/ui';

export type CanvasPaint = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  reduced: boolean,
) => void;

export function canvasPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, CANVAS_DPR_CAP);
}

/** Drives a full-bleed canvas with DPR sizing, rAF, and resize. */
export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  paint: CanvasPaint,
  reduced: boolean,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let frame = 0;
    let alive = true;
    const started = performance.now();

    const draw = (now: number) => {
      const ratio = canvasPixelRatio();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const nextWidth = Math.max(1, Math.floor(width * ratio));
      const nextHeight = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(context, width, height, reduced ? 0 : (now - started) / 1000, reduced);
      if (alive && !reduced) frame = requestAnimationFrame(draw);
    };

    draw(performance.now());
    const observer = new ResizeObserver(() => {
      if (reduced) draw(performance.now());
    });
    observer.observe(canvas);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [canvasRef, paint, reduced]);
}
