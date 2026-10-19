import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { edgeGeometry, edgeKey, labelPoint } from '../../algorithms/path/graph';
import type { DistanceMatrix as Matrix, GraphEdge, LaidOutNode, PathFrame } from '../../algorithms/path/types';
import { useDictionary } from '../../dictionary/dictionary';

const RADIUS = 26;

function distLabel(frame: PathFrame | null | undefined, id: string, inline: boolean) {
  if (!inline || !frame?.showDistances) return '';
  const value = frame.distances?.[id];
  return value == null ? '∞' : String(value);
}

export default function GraphView({
  nodes,
  edges,
  frame,
  start,
  goal,
  motion = false,
  pace = 420,
  step = 0,
  inlineDistances = true,
}: {
  nodes: LaidOutNode[];
  edges: GraphEdge[];
  frame: PathFrame | null;
  start: string;
  goal: string;
  motion?: boolean;
  pace?: number;
  step?: number;
  inlineDistances?: boolean;
}) {
  const dictionary = useDictionary();
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const picture = useRef<SVGSVGElement>(null);
  const route = frame?.path ?? [];
  const pathOrder = new Map<string, number>();
  for (let index = 0; index < route.length - 1; index += 1) {
    pathOrder.set(edgeKey(route[index], route[index + 1]), index);
  }
  const arriving = new Set(
    edges
      .filter((edge) => frame?.edgeRoles?.[edgeKey(edge.from, edge.to)] === 'relax')
      .map((edge) => edge.to),
  );

  useLayoutEffect(() => {
    const root = picture.current;
    if (!motion || !root) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll<SVGPathElement>('.graph-travel, .graph-draw').forEach((path) => {
      path.getAnimations().forEach((animation) => animation.cancel());
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });
    if (reduced) return undefined;
    const duration = Math.min(Math.max(90, pace - 40), Math.max(200, Math.round(pace * 0.72)));
    root.querySelectorAll<SVGPathElement>('.graph-travel').forEach((path) => {
      const length = path.getTotalLength();
      const head = Math.max(18, length * 0.22);
      path.style.strokeDasharray = `${head} ${length}`;
      path.animate([
        { strokeDashoffset: `${length + head}` },
        { strokeDashoffset: '0' },
      ], { duration, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    });
    root.querySelectorAll<SVGPathElement>('.graph-draw').forEach((path) => {
      const length = path.getTotalLength();
      const delay = Number(path.dataset.delay ?? 0);
      path.style.strokeDasharray = `${length}`;
      path.animate([
        { strokeDashoffset: `${length}` },
        { strokeDashoffset: '0' },
      ], { duration: Math.min(duration, 380), delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' });
    });
    return undefined;
  }, [motion, pace, step]);

  return (
    <div className={motion ? 'graph-wrap graph-motion' : 'graph-wrap'}>
      <svg ref={picture} viewBox="0 0 720 400" role="img" aria-label={dictionary.pathfinding.picture}>
        <defs>
          <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const from = byId[edge.from];
          const to = byId[edge.to];
          if (!from || !to) return null;
          const geometry = edgeGeometry(from, to, edge.bend);
          const label = labelPoint(from, to, edge.bend, edge.labelAt ?? 0.5);
          const tone = frame?.edgeRoles?.[edgeKey(edge.from, edge.to)] ?? 'idle';
          const path = geometry.curved
            ? `M ${geometry.x1} ${geometry.y1} Q ${geometry.cx} ${geometry.cy} ${geometry.x2} ${geometry.y2}`
            : `M ${geometry.x1} ${geometry.y1} L ${geometry.x2} ${geometry.y2}`;
          const travel = motion && (tone === 'consider' || tone === 'relax');
          const draw = motion && tone === 'path';
          return (
            <g key={edgeKey(edge.from, edge.to)}>
              <path className="graph-edge" data-tone={tone} d={path} markerEnd="url(#graph-arrow)" />
              {travel && <path className="graph-travel" data-tone={tone} d={path} />}
              {draw && (
                <path
                  className="graph-draw"
                  d={path}
                  data-delay={String((pathOrder.get(edgeKey(edge.from, edge.to)) ?? 0) * 80)}
                />
              )}
              <rect
                className="graph-weight"
                x={label.x - 14}
                y={label.y - 11}
                width="28"
                height="22"
                rx="7"
              />
              <text
                className="graph-weight-text"
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => {
          const tone = frame?.nodeRoles?.[node.id] ?? (node.id === start ? 'start' : node.id === goal ? 'goal' : 'idle');
          const distance = distLabel(frame, node.id, inlineDistances);
          return (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`} data-tone={tone} data-arrive={arriving.has(node.id) ? 'true' : 'false'}>
              {motion && tone === 'current' && <circle key={`${node.id}-${step}`} className="node-ring" r={RADIUS} />}
              <circle className="node-shape" data-tone={tone} r={RADIUS} />
              <text
                className="node-label"
                data-tone={tone}
                textAnchor="middle"
                dominantBaseline="central"
                y={distance ? -7 : 0}
              >
                {node.id}
              </text>
              {distance && (
                <text
                  key={distance}
                  className="node-dist"
                  data-tone={tone}
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={9}
                >
                  {distance}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DistanceStrip({
  nodes,
  frame,
  start,
  goal,
  label,
}: {
  nodes: LaidOutNode[];
  frame: PathFrame;
  start: string;
  goal: string;
  label: string;
}) {
  if (!frame.showDistances) return null;
  return (
    <div className="distance-strip">
      <span>{label}</span>
      {nodes.map((node) => {
        const value = frame.distances?.[node.id];
        const tone = frame.nodeRoles?.[node.id] ?? (node.id === start ? 'start' : node.id === goal ? 'goal' : 'idle');
        const text = value == null ? '∞' : String(value);
        return (
          <span key={node.id} className="distance-cell" data-tone={tone}>
            <small>{node.id}</small>
            <strong key={text}>{text}</strong>
          </span>
        );
      })}
    </div>
  );
}

export function QueueStrip({
  label,
  items,
  empty,
  motion = false,
}: {
  label: string;
  items: string[];
  empty: string;
  motion?: boolean;
}) {
  const chips = useRef(new Map<string, HTMLSpanElement>());
  const lastLeft = useRef(new Map<string, number>());
  const signature = items.join('|');

  useLayoutEffect(() => {
    if (!motion) {
      lastLeft.current = new Map([...chips.current].map(([id, chip]) => [id, chip.offsetLeft]));
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextLeft = new Map<string, number>();
    chips.current.forEach((chip, id) => {
      const left = chip.offsetLeft;
      const prev = lastLeft.current.get(id);
      nextLeft.set(id, left);
      chip.getAnimations().forEach((animation) => animation.cancel());
      if (reduced || prev == null) return;
      const dx = prev - left;
      if (Math.abs(dx) < 1) return;
      chip.animate([
        { transform: `translateX(${dx}px)` },
        { transform: 'translateX(0)' },
      ], { duration: 280, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    });
    lastLeft.current = nextLeft;
    return undefined;
  }, [motion, signature]);

  return (
    <p className="search-strip">
      <span>{label}</span>
      {items.length === 0 ? empty : (
        <span className="search-tokens">
          {items.map((id, index) => (
            <span
              key={items.indexOf(id) === index ? id : `${id}-${index}`}
              className="queue-chip"
              ref={(chip) => {
                const key = items.indexOf(id) === index ? id : `${id}-${index}`;
                if (chip) chips.current.set(key, chip);
                else chips.current.delete(key);
              }}
            >
              {id}
            </span>
          ))}
        </span>
      )}
    </p>
  );
}

export function DistanceMatrix({ matrix, motion = false }: { matrix: Matrix | null; motion?: boolean }) {
  const dictionary = useDictionary();
  if (!matrix) return null;
  const { labels, grid, focus } = matrix;
  return (
    <div
      className={motion ? 'pair-matrix graph-motion' : 'pair-matrix'}
      role="table"
      aria-label={dictionary.pathfinding.distances}
      style={{ '--pair-columns': labels.length + 1 } as CSSProperties}
    >
      <div className="pair-row pair-head">
        <span />
        {labels.map((label, index) => (
          <span key={label} data-k={focus?.k === index ? 'true' : 'false'}>{label}</span>
        ))}
      </div>
      {labels.map((label, row) => (
        <div className="pair-row" key={label}>
          <span data-k={focus?.k === row ? 'true' : 'false'}>{label}</span>
          {grid[row].map((value, column) => {
            const active = focus?.i === row && focus?.j === column;
            const via = focus?.k === row || focus?.k === column;
            return (
              <span
                key={`${label}-${column}`}
                data-active={active ? 'true' : 'false'}
                data-via={!active && via ? 'true' : 'false'}
              >
                {value == null ? '∞' : value}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
