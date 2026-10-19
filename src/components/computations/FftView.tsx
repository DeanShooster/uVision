import { useLayoutEffect, useRef } from 'react';
import { formatComplex } from '../../algorithms/compute/format';
import type { FftFrame } from '../../algorithms/compute/types';
import { useDictionary } from '../../dictionary/dictionary';

const WIDTH = 760;
const HEIGHT = 430;
const CENTERS = [124, 300, 476, 652];

function yAt(row: number, rows: number) {
  return 58 + row * ((HEIGHT - 78) / Math.max(1, rows - 1));
}

function cellTone(frame: FftFrame, column: number, row: number) {
  const active = frame.links.find((link) => link.active);
  if (frame.done && column === frame.columns.length - 1 && frame.columns[column][row]) return 'path';
  if (!active) return 'idle';
  if (column === active.fromCol && (row === active.top || row === active.bottom)) return 'current';
  if (column === active.fromCol + 1 && (row === active.top || row === active.bottom)) return 'relax';
  return 'idle';
}

export default function FftView({
  frame,
  motion = false,
  pace = 420,
  step = 0,
}: {
  frame: FftFrame;
  motion?: boolean;
  pace?: number;
  step?: number;
}) {
  const dictionary = useDictionary();
  const picture = useRef<SVGSVGElement>(null);
  const rows = frame.order.length;
  const active = frame.links.find((link) => link.active);
  const wires = frame.done
    ? frame.links
    : frame.links.filter((link) => active && link.fromCol === active.fromCol);

  useLayoutEffect(() => {
    const root = picture.current;
    if (!motion || !root) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll<SVGLineElement>('.fft-travel').forEach((line) => {
      line.getAnimations().forEach((animation) => animation.cancel());
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
    });
    if (reduced) return undefined;
    const duration = Math.min(Math.max(90, pace - 40), Math.max(200, Math.round(pace * 0.72)));
    root.querySelectorAll<SVGLineElement>('.fft-travel').forEach((line) => {
      const length = line.getTotalLength();
      const head = Math.max(14, length * 0.28);
      const delay = Number(line.dataset.delay ?? 0);
      line.style.strokeDasharray = `${head} ${length}`;
      line.animate([
        { strokeDashoffset: `${length + head}` },
        { strokeDashoffset: '0' },
      ], { duration, delay, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    });
    return undefined;
  }, [motion, pace, step]);

  return (
    <svg
      ref={picture}
      className={motion ? 'fft-diagram fft-motion' : 'fft-diagram'}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={dictionary.computations.fftPicture}
    >
      <text className="fft-index" x="16" y="28">{dictionary.computations.fftFrom}</text>
      <text className="fft-index" x={WIDTH - 14} y="28" textAnchor="end">{dictionary.computations.fftFreq}</text>
      {dictionary.computations.fftColumns.map((title, column) => (
        <text key={title} className="fft-title" x={CENTERS[column]} y="28" textAnchor="middle">
          {title}
        </text>
      ))}
      {wires.map((link) => {
        const fromX = CENTERS[link.fromCol] ?? 0;
        const toX = CENTERS[link.fromCol + 1] ?? 0;
        const pairs = [
          [link.top, link.top],
          [link.top, link.bottom],
          [link.bottom, link.top],
          [link.bottom, link.bottom],
        ];
        return pairs.map(([fromRow, toRow]) => {
          const key = `${link.fromCol}-${fromRow}-${toRow}-${link.top}`;
          const fromBottom = fromRow === link.bottom;
          return (
            <g key={key}>
              <line
                className="fft-wire"
                data-active={link.active ? 'true' : 'false'}
                x1={fromX + 48}
                y1={yAt(fromRow, rows)}
                x2={toX - 48}
                y2={yAt(toRow, rows)}
              />
              {motion && link.active && (
                <line
                  className="fft-travel"
                  data-tone={fromBottom ? 'sub' : 'add'}
                  data-delay={fromBottom ? '70' : '0'}
                  x1={fromX + 48}
                  y1={yAt(fromRow, rows)}
                  x2={toX - 48}
                  y2={yAt(toRow, rows)}
                />
              )}
            </g>
          );
        });
      })}
      {frame.columns.map((column, columnIndex) => column.map((value, row) => {
        if (!value) return null;
        const tone = cellTone(frame, columnIndex, row);
        return (
          <g key={`${columnIndex}-${row}`} transform={`translate(${CENTERS[columnIndex]} ${yAt(row, rows)})`}>
            <rect className="fft-cell" data-tone={tone} x={-48} y={-14} width="96" height="28" rx="8" />
            <text className="fft-text" data-tone={tone} textAnchor="middle" dominantBaseline="central">
              {formatComplex(value)}
            </text>
          </g>
        );
      }))}
      {frame.order.map((index, row) => (
        <text key={`from-${index}`} className="fft-index" x="16" y={yAt(row, rows)} dominantBaseline="central">
          {index}
        </text>
      ))}
      {frame.order.map((_, row) => (
        <text key={`freq-${row}`} className="fft-index" x={WIDTH - 14} y={yAt(row, rows)} textAnchor="end" dominantBaseline="central">
          {row}
        </text>
      ))}
    </svg>
  );
}
