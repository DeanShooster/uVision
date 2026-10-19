import { useLayoutEffect, useMemo, useRef } from 'react';
import { formatNum, toneAt } from '../../algorithms/frame';
import type { SortFrame } from '../../algorithms/types';
import { useDictionary } from '../../dictionary/dictionary';
import { placeBars } from './placeBars';

type Point = { x: number; y: number };

function treePoint(index: number, depth: number): Point {
  const level = Math.floor(Math.log2(index + 1));
  const width = 2 ** level;
  const offset = index - (width - 1);
  return {
    x: 8 + ((offset + 0.5) / width) * 84,
    y: 12 + (level / Math.max(1, depth)) * 56,
  };
}

function finishedPoint(index: number, count: number): Point {
  return {
    x: 8 + ((index + 0.5) / count) * 84,
    y: 90,
  };
}

function arrayPoint(index: number, count: number): Point {
  return {
    x: 8 + ((index + 0.5) / count) * 84,
    y: 58,
  };
}

export default function HeapTree({
  frame,
  motion = false,
  pace = 420,
}: {
  frame?: SortFrame | null;
  motion?: boolean;
  pace?: number;
}) {
  const dictionary = useDictionary();
  const values = frame?.values ?? [];
  const sorted = new Set(frame?.sorted ?? []);
  const asArray = frame?.shape === 'array';
  const depth = Math.floor(Math.log2(Math.max(1, values.length)));
  const valueKey = values.map((value) => (value == null ? 'x' : value)).join(',');
  const layoutKey = `${asArray ? 'array' : 'heap'}:${[...sorted].join('.')}`;
  const previous = useRef<ReturnType<typeof placeBars> | null>(null);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const lastPoint = useRef(new Map<number, { left: number; top: number }>());

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
    const nextPoint = new Map<number, { left: number; top: number }>();
    nodes.current.forEach((node, id) => {
      const left = node.offsetLeft;
      const top = node.offsetTop;
      const prev = lastPoint.current.get(id);
      nextPoint.set(id, { left, top });
      node.getAnimations().forEach((animation) => animation.cancel());
      node.classList.remove('is-lifting');
      if (reduced || prev == null) return;
      const dx = prev.left - left;
      const dy = prev.top - top;
      if (Math.hypot(dx, dy) < 1) {
        node.style.zIndex = '';
        return;
      }
      const duration = Math.min(Math.max(90, pace - 40), Math.max(160, Math.round(pace * 0.85)));
      node.classList.add('is-lifting');
      node.style.zIndex = String(3 + Math.min(24, Math.round(Math.hypot(dx, dy) / 8)));
      const center = 'translate(-50%, -50%)';
      const animation = node.animate([
        { transform: `${center} translate(${dx}px, ${dy}px)` },
        { transform: center },
      ], { duration, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      animation.onfinish = () => {
        node.classList.remove('is-lifting');
        node.style.zIndex = '';
      };
    });
    lastPoint.current = nextPoint;
    previous.current = placed;
    return undefined;
  }, [layoutKey, motion, pace, placed]);

  const points = placed.map((_, index) => (
    asArray
      ? arrayPoint(index, values.length)
      : sorted.has(index)
        ? finishedPoint(index, values.length)
        : treePoint(index, depth)
  ));

  const edges = asArray ? [] : placed.flatMap((_, index) => {
    if (index === 0 || sorted.has(index)) return [];
    const parent = Math.floor((index - 1) / 2);
    if (sorted.has(parent)) return [];
    const from = points[parent];
    const to = points[index];
    const parentRole = frame?.roles?.[parent];
    const childRole = frame?.roles?.[index];
    const tone = parentRole === 'swap' && childRole === 'swap'
      ? 'swap'
      : (parentRole === 'pivot' && childRole === 'compare') || (parentRole === 'compare' && childRole === 'pivot')
        ? 'compare'
        : 'idle';
    return [{ index, from, to, tone }];
  });

  return (
    <div
      className="heap-tree"
      data-shape={asArray ? 'array' : 'heap'}
      data-count={values.length > 8 ? 'crowded' : 'comfortable'}
      role="img"
      aria-label={frame?.note || dictionary.sorting.picture}
    >
      <svg className="heap-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {edges.map((edge) => (
          <line
            key={edge.index}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            data-tone={edge.tone}
          />
        ))}
      </svg>
      {placed.map((node, index) => {
        const point = points[index];
        const tone = node.value == null ? 'empty' : toneAt(frame, index);
        return (
          <div
            key={node.id}
            className="heap-node"
            data-tone={tone}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            ref={motion ? (element) => {
              if (element) nodes.current.set(node.id, element);
              else nodes.current.delete(node.id);
            } : undefined}
          >
            <strong>{formatNum(node.value)}</strong>
            <small>{index}</small>
          </div>
        );
      })}
    </div>
  );
}
