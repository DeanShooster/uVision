import { useEffect, useState } from 'react';
import { LOOP_HOLD_MS, LOOP_STEP_MS } from '../constants/ui';
import { prefersReducedMotion, useReducedMotion } from './useReducedMotion';

export function useLoop<T>(
  frames: readonly T[],
  step = LOOP_STEP_MS,
  hold = LOOP_HOLD_MS,
) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<T | null>(frames[0] ?? null);

  useEffect(() => {
    if (!frames.length) return undefined;
    if (reduced || prefersReducedMotion()) {
      setFrame(frames[frames.length - 1]);
      return undefined;
    }
    let index = 0;
    let timeoutId = 0;
    const tick = () => {
      setFrame(frames[index]);
      const atEnd = index === frames.length - 1;
      index = (index + 1) % frames.length;
      timeoutId = window.setTimeout(tick, atEnd ? hold : step);
    };
    tick();
    return () => window.clearTimeout(timeoutId);
  }, [frames, step, hold, reduced]);

  return frame;
}
