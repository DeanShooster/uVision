import { useLayoutEffect, useMemo, useRef } from 'react';
import type { EuclideanFrame } from '../../algorithms/compute/types';

type EuclidRole = 'a' | 'b' | 'remainder';

type EuclidBar = {
  id: number;
  value: number;
  role: EuclidRole;
};

const ROLE_COLUMN: Record<EuclidRole, number> = { a: 1, b: 2, remainder: 3 };

const ROLE_PREFERENCE: Record<EuclidRole, EuclidRole[]> = {
  a: ['a', 'b', 'remainder'],
  b: ['b', 'remainder', 'a'],
  remainder: ['remainder', 'a', 'b'],
};

let nextEuclidId = 1;

function slotsFor(frame: EuclideanFrame) {
  const slots: { role: EuclidRole; value: number }[] = [
    { role: 'a', value: frame.a },
    { role: 'b', value: frame.b },
  ];
  if (frame.remainder != null && !frame.done && frame.remainder !== frame.b) {
    slots.push({ role: 'remainder', value: frame.remainder });
  }
  return slots;
}

function placeEuclid(previous: EuclidBar[] | null, frame: EuclideanFrame) {
  const slots = slotsFor(frame);
  if (!previous) {
    return slots.map((slot) => ({ id: nextEuclidId++, value: slot.value, role: slot.role }));
  }
  const used = new Set<number>();
  return slots.map((slot) => {
    let match: EuclidBar | undefined;
    for (const role of ROLE_PREFERENCE[slot.role]) {
      match = previous.find((bar) => !used.has(bar.id) && bar.role === role && bar.value === slot.value);
      if (match) break;
    }
    if (!match) {
      match = previous.find((bar) => !used.has(bar.id) && bar.value === slot.value);
    }
    if (match) {
      used.add(match.id);
      return { id: match.id, value: slot.value, role: slot.role };
    }
    return { id: nextEuclidId++, value: slot.value, role: slot.role };
  });
}

function toneFor(frame: EuclideanFrame, role: EuclidRole) {
  if (frame.done && role === 'a') return 'path';
  if (role === 'a') return 'current';
  if (role === 'b') return frame.done ? 'idle' : 'frontier';
  return 'relax';
}

function StaticEuclid({ frame }: { frame: EuclideanFrame }) {
  const columns: { label: string; value: number; tone: string }[] = [
    { label: 'a', value: frame.a, tone: frame.done ? 'path' : 'current' },
    { label: 'b', value: frame.b, tone: frame.done ? 'idle' : 'frontier' },
  ];
  if (frame.remainder != null && !frame.done) {
    columns.push({ label: 'remainder', value: frame.remainder, tone: 'relax' });
  }
  return (
    <div className="euclid">
      <div className="euclid-bars">
        {columns.map((column) => (
          <div className="euclid-col" key={column.label}>
            <div
              className="euclid-bar"
              data-tone={column.tone}
              style={{ height: `${Math.max(8, (column.value / frame.scale) * 100)}%` }}
            />
            <strong>{column.value}</strong>
            <span>{column.label}</span>
          </div>
        ))}
      </div>
      <Equation frame={frame} motion={false} />
    </div>
  );
}

function Equation({ frame, motion }: { frame: EuclideanFrame; motion: boolean }) {
  if (frame.quotient == null || frame.dividend == null || frame.divisor == null || frame.remainder == null) {
    return null;
  }
  const text = `${frame.dividend} = ${frame.quotient} × ${frame.divisor} + ${frame.remainder}`;
  return <p key={text} className={motion ? 'euclid-eq euclid-eq-in' : 'euclid-eq'}>{text}</p>;
}

export default function EuclideanView({
  frame,
  motion = false,
  pace = 420,
}: {
  frame: EuclideanFrame;
  motion?: boolean;
  pace?: number;
}) {
  const signature = `${motion}|${frame.a}|${frame.b}|${frame.remainder ?? ''}|${frame.done}|${frame.dividend ?? ''}`;
  const previous = useRef<EuclidBar[] | null>(null);
  const wasMotion = useRef(false);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const lastLeft = useRef(new Map<number, number>());

  const placed = useMemo(
    () => placeEuclid(wasMotion.current ? previous.current : null, frame),
    [signature],
  );

  useLayoutEffect(() => {
    wasMotion.current = motion;
    if (!motion) {
      previous.current = null;
      lastLeft.current = new Map();
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextLeft = new Map<number, number>();
    const duration = Math.min(560, Math.max(160, Math.round(pace * 0.72)));
    nodes.current.forEach((node, id) => {
      const left = node.offsetLeft;
      const prev = lastLeft.current.get(id);
      nextLeft.set(id, left);
      node.getAnimations().forEach((animation) => animation.cancel());
      node.classList.remove('is-lifting');
      const bar = node.querySelector<HTMLElement>('.euclid-bar');
      if (reduced) return;
      if (prev == null) {
        if (!bar || lastLeft.current.size === 0) return;
        const target = bar.style.height;
        bar.style.transition = 'none';
        bar.style.height = '0%';
        void bar.offsetHeight;
        bar.style.transition = `height ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1)`;
        bar.style.height = target;
        return;
      }
      const dx = prev - left;
      if (Math.abs(dx) < 1) return;
      node.classList.add('is-lifting');
      const animation = node.animate([
        { transform: `translate3d(${dx}px, 0, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      animation.onfinish = () => node.classList.remove('is-lifting');
    });
    lastLeft.current = nextLeft;
    previous.current = placed;
    return undefined;
  }, [motion, pace, placed]);

  if (!motion) return <StaticEuclid frame={frame} />;

  const occupied = new Set(placed.map((bar) => bar.role));

  return (
    <div className="euclid euclid-motion">
      <div className="euclid-bars">
        {(['a', 'b', 'remainder'] as const).map((role) => (
          <span
            key={role}
            className="euclid-slot"
            data-empty={occupied.has(role) ? 'false' : 'true'}
            style={{ gridColumn: ROLE_COLUMN[role] }}
          >
            {occupied.has(role) ? role : ''}
          </span>
        ))}
        {placed.map((bar) => {
          const tone = toneFor(frame, bar.role);
          const cap = bar.role === 'a'
            && frame.remainder != null
            && frame.dividend === frame.a
            && frame.a > 0
            && !frame.done
            ? (frame.remainder / frame.a) * 100
            : null;
          return (
            <div
              key={bar.id}
              className="euclid-mover"
              style={{ gridColumn: ROLE_COLUMN[bar.role] }}
              ref={(node) => {
                if (node) nodes.current.set(bar.id, node);
                else nodes.current.delete(bar.id);
              }}
            >
              <div className="euclid-well">
                <div
                  className="euclid-bar"
                  data-tone={tone}
                  style={{
                    height: `${Math.max(8, (bar.value / frame.scale) * 100)}%`,
                    background: cap == null
                      ? undefined
                      : `linear-gradient(to top, #14958c ${100 - cap}%, #e15a38 ${100 - cap}%)`,
                  }}
                />
              </div>
              <strong>{bar.value}</strong>
            </div>
          );
        })}
      </div>
      <Equation frame={frame} motion />
    </div>
  );
}
