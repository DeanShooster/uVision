import { useLayoutEffect, useMemo, useRef } from 'react';
import { formatNum, toneAt } from '../../algorithms/frame';
import type { SortFrame } from '../../algorithms/types';
import { useDictionary } from '../../dictionary/dictionary';
import { placeBars, type Placed } from './placeBars';

export default function BarChart({
  frame,
  compact = false,
  motion = false,
  pace = 420,
}: {
  frame?: SortFrame | null;
  compact?: boolean;
  motion?: boolean;
  pace?: number;
}) {
  const dictionary = useDictionary();
  const values = frame?.values ?? [];
  const numeric = values.filter((value) => value != null);
  const max = Math.max(1, ...numeric);
  const valueKey = values.map((value) => (value == null ? 'x' : value)).join(',');
  const previous = useRef<Placed[] | null>(null);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const lastLeft = useRef(new Map<number, number>());

  const placed = useMemo(
    () => placeBars(previous.current, values),
    [valueKey],
  );

  useLayoutEffect(() => {
    if (!motion) {
      previous.current = placed;
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextLeft = new Map<number, number>();
    nodes.current.forEach((node, id) => {
      const left = node.offsetLeft;
      const prev = lastLeft.current.get(id);
      nextLeft.set(id, left);
      node.getAnimations().forEach((animation) => animation.cancel());
      node.classList.remove('is-lifting');
      if (reduced || prev == null) return;
      const dx = prev - left;
      if (Math.abs(dx) < 1) {
        node.style.zIndex = '';
        return;
      }
      const duration = Math.min(560, Math.max(160, Math.round(pace * 0.72)));
      const lift = -Math.min(56, 16 + Math.abs(dx) / 10);
      node.classList.add('is-lifting');
      node.style.zIndex = String(3 + Math.min(24, Math.round(Math.abs(dx) / 8)));
      const animation = node.animate([
        { transform: `translate3d(${dx}px, 0, 0)` },
        { transform: `translate3d(${dx * 0.5}px, ${lift}px, 0)`, offset: 0.46 },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      animation.onfinish = () => {
        node.classList.remove('is-lifting');
        node.style.zIndex = '';
      };
    });
    lastLeft.current = nextLeft;
    previous.current = placed;
    return undefined;
  }, [motion, pace, placed]);

  return (
    <div
      className={compact ? 'chart chart-compact' : motion ? 'chart chart-motion' : 'chart'}
      data-count={values.length > 14 ? 'crowded' : 'comfortable'}
      role="img"
      aria-label={frame?.note || dictionary.sorting.picture}
    >
      {(motion ? placed : values.map((value, index) => ({ id: index, value }))).map((bar, index) => {
        const empty = bar.value == null;
        const tone = empty ? 'empty' : toneAt(frame, index);
        const height = empty ? 8 : Math.max(7, (bar.value! / max) * 100);
        return (
          <div
            className="chart-col"
            key={bar.id}
            data-tone={tone}
            ref={motion ? (node) => {
              if (node) nodes.current.set(bar.id, node);
              else nodes.current.delete(bar.id);
            } : undefined}
          >
            <div className="bar" data-tone={tone} style={{ height: `${height}%` }}>
              {!empty && <span className="bar-label">{formatNum(bar.value)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
