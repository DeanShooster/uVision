import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { HiPause, HiPlay } from 'react-icons/hi2';
import { LuRotateCcw, LuSkipBack, LuSkipForward } from 'react-icons/lu';
import type { ComputeAlgorithm } from '../../algorithms/compute/catalog';
import { euclidean } from '../../algorithms/compute/euclidean';
import { fft } from '../../algorithms/compute/fft';
import { pageRank, parseRankValues, RANK_NODE_MAX, RANK_NODE_MIN, randomRankGraph, ringGraph, TEXTBOOK_GRAPH } from '../../algorithms/compute/pageRank';
import type { RankGraph } from '../../algorithms/compute/types';
import type { ComputeFrame } from '../../algorithms/compute/types';
import {
  PLAYBACK_SPEED_DEFAULT_MS,
  PLAYBACK_SPEED_MAX_MS,
  PLAYBACK_SPEED_MIN_MS,
  PLAYBACK_SPEED_SLIDER_SPAN,
} from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { usePlaybackKeys } from '../../hooks/usePlaybackKeys';
import Explanation from '../sort/Explanation';
import EuclideanView from './EuclideanView';
import FftView from './FftView';
import PageRankView from './PageRankView';

const RANK_COUNTS = Array.from(
  { length: RANK_NODE_MAX - RANK_NODE_MIN + 1 },
  (_, index) => RANK_NODE_MIN + index,
);

function equalRankDraft(count: number) {
  return Array.from({ length: count }, () => '1').join(', ');
}

const FFT_PRESETS = [
  { id: 'ramp' as const, value: '1, 2, 3, 4, 5, 6, 7, 8' },
  { id: 'impulse' as const, value: '1, 0, 0, 0, 0, 0, 0, 0' },
  { id: 'flat' as const, value: '1, 1, 1, 1, 1, 1, 1, 1' },
];

function parseSamples(raw: string) {
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 8 || parts.some((part) => !/^-?\d+$/.test(part))) return null;
  const values = parts.map(Number);
  if (values.some((value) => value < -20 || value > 20)) return null;
  return values;
}

function Visual({
  frame,
  motion,
  pace,
  step,
}: {
  frame: ComputeFrame;
  motion: boolean;
  pace: number;
  step: number;
}) {
  if (frame.kind === 'euclidean') return <EuclideanView frame={frame} motion={motion} pace={pace} />;
  if (frame.kind === 'fft') return <FftView frame={frame} motion={motion} pace={pace} step={step} />;
  return <PageRankView frame={frame} motion={motion} pace={pace} step={step} />;
}

export default function ComputeSimulator({ algorithm }: { algorithm: ComputeAlgorithm }) {
  const dictionary = useDictionary();
  const [a, setA] = useState(48);
  const [b, setB] = useState(18);
  const [draft, setDraft] = useState(FFT_PRESETS[0].value);
  const [rankCount, setRankCount] = useState(TEXTBOOK_GRAPH.pages.length);
  const [rankDraft, setRankDraft] = useState(equalRankDraft(TEXTBOOK_GRAPH.pages.length));
  const [rankGraph, setRankGraph] = useState<RankGraph>(TEXTBOOK_GRAPH);
  const [frames, setFrames] = useState<ComputeFrame[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEED_DEFAULT_MS);

  const resting = useMemo(() => {
    if (algorithm.id !== 'euclidean') return null;
    return euclidean(a, b)[0] ?? null;
  }, [algorithm.id, a, b]);

  useEffect(() => {
    setFrames(null);
    setCursor(0);
    setPlaying(false);
  }, [algorithm.id, a, b, draft, rankCount, rankDraft, rankGraph]);

  useEffect(() => {
    if (!playing || !frames) return undefined;
    if (cursor >= frames.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setCursor((current) => Math.min(current + 1, frames.length - 1));
    }, speed);
    return () => window.clearTimeout(timeoutId);
  }, [playing, cursor, frames, speed]);

  useEffect(() => {
    document.title = dictionary.brand.titled(algorithm.heading);
  }, [algorithm.heading, dictionary]);

  const frame = frames?.[cursor] ?? (resting
    ? { ...resting, note: algorithm.idleNote, caption: '' }
    : null);

  function canRun() {
    if (algorithm.id === 'euclidean') return true;
    if (algorithm.id === 'fft') return Boolean(parseSamples(draft));
    return Boolean(parseRankValues(rankDraft, rankCount));
  }

  function buildTrace() {
    if (algorithm.id === 'euclidean') return euclidean(a, b);
    if (algorithm.id === 'fft') {
      const samples = parseSamples(draft);
      return samples ? fft(samples) : [];
    }
    const values = parseRankValues(rankDraft, rankCount);
    return values ? pageRank(rankGraph, values) : [];
  }

  function run() {
    const next = buildTrace();
    if (next.length === 0) return;
    setFrames(next);
    setCursor(0);
    setPlaying(next.length > 1);
  }

  function step(direction: number) {
    if (!frames) return;
    setPlaying(false);
    setCursor((current) => Math.min(frames.length - 1, Math.max(0, current + direction)));
  }

  function togglePlay() {
    if (!frames) {
      run();
      return;
    }
    if (cursor >= frames.length - 1) {
      setCursor(0);
      setPlaying(true);
      return;
    }
    setPlaying((current) => !current);
  }

  usePlaybackKeys({ togglePlay, step });

  function chooseRankCount(count: number) {
    if (count === rankCount) return;
    setRankCount(count);
    setRankDraft(equalRankDraft(count));
    setRankGraph(ringGraph(count));
  }

  function randomizeRank() {
    const count = RANK_NODE_MIN + Math.floor(Math.random() * (RANK_NODE_MAX - RANK_NODE_MIN + 1));
    const values = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
    setRankCount(count);
    setRankDraft(values.join(', '));
    setRankGraph(randomRankGraph(count));
  }

  function onNumber(setter: (value: number) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      if (!Number.isFinite(next)) return;
      setter(Math.max(0, Math.min(9999, Math.trunc(next))));
    };
  }

  const stepLabel = frames ? dictionary.player.step(cursor + 1, frames.length) : dictionary.player.ready;

  return (
    <div className="sim-layout">
      <section className="bench" aria-label={dictionary.player.simulator(algorithm.heading)}>
        <div className="bench-heading">
          <h1>{algorithm.heading}</h1>
          <p className="blurb">{algorithm.blurb}</p>
        </div>

        {algorithm.id === 'euclidean' && (
          <>
            <div className="preset-row">
              <button
                type="button"
                className="button"
                disabled={playing}
                onClick={() => {
                  setA(1 + Math.floor(Math.random() * 999));
                  setB(1 + Math.floor(Math.random() * 999));
                }}
              >
                {dictionary.computations.random}
              </button>
            </div>
            <div className="pair-inputs">
              <label className="array-field">
                <span>{dictionary.computations.valueA}</span>
                <input type="number" min={0} max={9999} value={a} disabled={playing} onChange={onNumber(setA)} />
              </label>
              <label className="array-field">
                <span>{dictionary.computations.valueB}</span>
                <input type="number" min={0} max={9999} value={b} disabled={playing} onChange={onNumber(setB)} />
              </label>
            </div>
          </>
        )}

        {algorithm.id === 'fft' && (
          <>
            <div className="preset-row">
              {FFT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="button"
                  disabled={playing}
                  onClick={() => setDraft(preset.value)}
                >
                  {dictionary.computations.presets[preset.id]}
                </button>
              ))}
            </div>
            <label className="array-field">
              <span>{dictionary.computations.samples}</span>
              <input
                value={draft}
                disabled={playing}
                onChange={(event) => setDraft(event.target.value)}
                inputMode="numeric"
                aria-describedby="sample-hint"
              />
            </label>
            <p id="sample-hint" className="hint">{dictionary.computations.sampleHint}</p>
          </>
        )}

        {algorithm.id === 'pagerank' && (
          <>
            <div className="endpoint-row">
              <span>{dictionary.computations.nodes}</span>
              {RANK_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={count === rankCount ? 'button primary' : 'button'}
                  disabled={playing}
                  onClick={() => chooseRankCount(count)}
                >
                  {count}
                </button>
              ))}
              <button type="button" className="button" disabled={playing} onClick={randomizeRank}>
                {dictionary.computations.random}
              </button>
            </div>
            <label className="array-field">
              <span>{dictionary.computations.values}</span>
              <input
                value={rankDraft}
                disabled={playing}
                onChange={(event) => setRankDraft(event.target.value)}
                inputMode="decimal"
                aria-describedby="rank-hint"
              />
            </label>
            <p id="rank-hint" className="hint">
              {parseRankValues(rankDraft, rankCount)
                ? dictionary.computations.rankHint
                : dictionary.computations.rankInvalid(rankCount)}
            </p>
          </>
        )}

        <div className="chart-stage graph-stage">
          {frame?.caption && <p className="chart-caption">{frame.caption}</p>}
          {frame ? <Visual frame={frame} motion={Boolean(frames)} pace={speed} step={cursor} /> : (
            <p className="empty-chart">
              {algorithm.id === 'pagerank'
                ? dictionary.computations.emptyRanks(rankCount)
                : dictionary.computations.emptySamples}
            </p>
          )}
        </div>

        <ul className="legend">
          {algorithm.legend.map(([tone, label]) => (
            <li key={tone}><i data-tone={tone} />{label}</li>
          ))}
        </ul>

        <div className="step-note" aria-live="polite">
          <span>{stepLabel}</span>
          <p>{frame?.note}</p>
        </div>

        <div className="transport">
          <button type="button" className="button primary sort-go" onClick={run} disabled={!canRun()}>
            {dictionary.player.run}
          </button>
          <button type="button" className="icon-button" onClick={() => step(-1)} disabled={!frames} aria-label={dictionary.player.previous}>
            <LuSkipBack />
          </button>
          <button type="button" className="icon-button" onClick={togglePlay} disabled={!canRun()} aria-label={playing ? dictionary.player.pause : dictionary.player.play}>
            {playing ? <HiPause /> : <HiPlay />}
          </button>
          <button type="button" className="icon-button" onClick={() => step(1)} disabled={!frames} aria-label={dictionary.player.next}>
            <LuSkipForward />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => { setPlaying(false); setCursor(0); }}
            disabled={!frames}
            aria-label={dictionary.player.replay}
          >
            <LuRotateCcw />
          </button>
          <label className="speed">
            <span>{dictionary.player.speed}</span>
            <input
              type="range"
              min={PLAYBACK_SPEED_MIN_MS}
              max={PLAYBACK_SPEED_MAX_MS}
              step="20"
              value={PLAYBACK_SPEED_SLIDER_SPAN - speed}
              onChange={(event) => setSpeed(PLAYBACK_SPEED_SLIDER_SPAN - Number(event.target.value))}
              aria-valuetext={dictionary.player.perStep(speed)}
            />
          </label>
        </div>
        <input
          className="scrubber"
          type="range"
          min={0}
          max={Math.max(0, (frames?.length ?? 1) - 1)}
          value={frames ? cursor : 0}
          disabled={!frames}
          onChange={(event) => {
            setPlaying(false);
            setCursor(Number(event.target.value));
          }}
          aria-label={dictionary.player.progress}
        />
      </section>
      <Explanation algorithm={algorithm} />
    </div>
  );
}
