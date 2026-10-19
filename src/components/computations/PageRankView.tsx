import { useLayoutEffect, useRef } from 'react';
import { formatNumber } from '../../algorithms/compute/format';
import type { PageRankFrame } from '../../algorithms/compute/types';
import { edgeGeometry, labelPoint } from '../../algorithms/path/graph';
import { useDictionary } from '../../dictionary/dictionary';

function rankRadius(score: number) {
  return 22 + Math.min(Math.max(score, 0), 0.55) * 24;
}

function formatTeleport(amount: number) {
  return amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

export default function PageRankView({
  frame,
  motion = false,
  pace = 420,
  step = 0,
}: {
  frame: PageRankFrame;
  motion?: boolean;
  pace?: number;
  step?: number;
}) {
  const dictionary = useDictionary();
  const picture = useRef<SVGSVGElement>(null);
  const circles = useRef(new Map<string, SVGCircleElement>());
  const radii = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = picture.current;
    if (!motion || !root) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll<SVGPathElement>('.graph-travel').forEach((path) => {
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
    return undefined;
  }, [motion, pace, step]);

  useLayoutEffect(() => {
    const nextRadii = new Map<string, number>();
    frame.pages.forEach((page, index) => {
      nextRadii.set(page.id, rankRadius(frame.scores[index] ?? 0));
    });
    if (!motion) {
      radii.current = nextRadii;
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = Math.min(Math.max(160, pace - 40), Math.max(220, Math.round(pace * 0.72)));
    nextRadii.forEach((next, id) => {
      const circle = circles.current.get(id);
      const previous = radii.current.get(id);
      if (!circle || reduced || previous == null || Math.abs(previous - next) < 0.4) return;
      circle.getAnimations().filter((animation) => animation.id === 'rank-radius').forEach((animation) => animation.cancel());
      const animation = circle.animate(
        [{ r: previous }, { r: next }],
        { duration, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
      animation.id = 'rank-radius';
    });
    radii.current = nextRadii;
    return undefined;
  }, [frame, motion, pace]);

  const teleport = frame.teleport == null ? '' : dictionary.computations.rankTeleport(formatTeleport(frame.teleport));
  const received = new Set(
    frame.focus == null
      ? []
      : frame.shares.length === 0
        ? frame.pages.map((_, index) => index)
        : frame.shares.map((share) => share.to),
  );

  return (
    <div className={motion ? 'graph-wrap graph-motion rank-motion' : 'graph-wrap'}>
      <svg ref={picture} viewBox="0 0 720 400" role="img" aria-label={dictionary.computations.rankPicture}>
        <defs>
          <marker id="rank-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {frame.edges.map((edge) => {
          const from = frame.pages[edge.from];
          const to = frame.pages[edge.to];
          if (!from || !to) return null;
          const geometry = edgeGeometry(from, to, edge.bend);
          const label = labelPoint(from, to, edge.bend, 0.5);
          const share = frame.shares.find((item) => item.from === edge.from && item.to === edge.to);
          const path = geometry.curved
            ? `M ${geometry.x1} ${geometry.y1} Q ${geometry.cx} ${geometry.cy} ${geometry.x2} ${geometry.y2}`
            : `M ${geometry.x1} ${geometry.y1} L ${geometry.x2} ${geometry.y2}`;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path className="graph-edge" data-tone={share ? 'relax' : 'idle'} d={path} markerEnd="url(#rank-arrow)" />
              {motion && share && <path className="graph-travel" data-tone="relax" d={path} />}
              {share && (
                <>
                  <rect className="graph-weight" x={label.x - 22} y={label.y - 11} width="44" height="22" rx="7" />
                  <text className={motion ? 'graph-weight-text rank-share' : 'graph-weight-text'} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">
                    {formatNumber(share.amount)}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {frame.pages.map((page, index) => {
          const tone = frame.leader === index ? 'path' : frame.focus === index ? 'current' : 'idle';
          const score = formatNumber(frame.scores[index] ?? 0);
          const radius = rankRadius(frame.scores[index] ?? 0);
          return (
            <g key={page.id} data-tone={tone} transform={`translate(${page.x} ${page.y})`}>
              <circle
                className="node-shape"
                data-tone={tone}
                r={radius}
                ref={(node) => {
                  if (node) circles.current.set(page.id, node);
                  else circles.current.delete(page.id);
                }}
              />
              {motion && frame.focus === index && (
                <circle key={`${page.id}-${step}`} className="node-ring" r={radius} />
              )}
              <text className="node-label" data-tone={tone} y="-7" textAnchor="middle" dominantBaseline="central">{page.id}</text>
              <text key={score} className="node-dist" data-tone={tone} y="9" textAnchor="middle" dominantBaseline="central">
                {score}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="rank-writing">
        <span>{dictionary.computations.rankWriting}</span>
        {frame.pages.map((page, index) => {
          const value = frame.writing?.[index];
          const text = value == null ? '—' : formatNumber(value);
          const tone = frame.leader === index ? 'path' : received.has(index) ? 'relax' : 'idle';
          return (
            <div className="rank-write-cell" data-tone={tone} key={page.id}>
              <small>{page.id}</small>
              <strong>{text}</strong>
            </div>
          );
        })}
      </div>
      <p className="rank-teleport" data-empty={teleport ? 'false' : 'true'} aria-hidden={teleport ? undefined : true}>{teleport || '\u00a0'}</p>
    </div>
  );
}
