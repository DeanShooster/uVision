import { useEffect, useState } from 'react';
import { HiPause, HiPlay } from 'react-icons/hi2';
import { LuRotateCcw, LuSkipBack, LuSkipForward } from 'react-icons/lu';
import { NODE_COUNT_MAX, NODE_COUNT_MIN, randomGraph } from '../../algorithms/path/graph';
import type { PathAlgorithm, PathFrame } from '../../algorithms/path/types';
import {
  PLAYBACK_SPEED_DEFAULT_MS,
  PLAYBACK_SPEED_MAX_MS,
  PLAYBACK_SPEED_MIN_MS,
  PLAYBACK_SPEED_SLIDER_SPAN,
} from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { usePlaybackKeys } from '../../hooks/usePlaybackKeys';
import Explanation from '../sort/Explanation';
import GraphView, { DistanceMatrix, DistanceStrip, QueueStrip } from './GraphView';

const NODE_COUNTS = Array.from(
  { length: NODE_COUNT_MAX - NODE_COUNT_MIN + 1 },
  (_, index) => NODE_COUNT_MIN + index,
);

export default function PathSimulator({ algorithm }: { algorithm: PathAlgorithm }) {
  const dictionary = useDictionary();
  const [count, setCount] = useState(6);
  const [negative, setNegative] = useState(false);
  const [graph, setGraph] = useState(() => randomGraph({ count: 6 }));
  const [start, setStart] = useState(algorithm.start);
  const [goal, setGoal] = useState(algorithm.goal);
  const [frames, setFrames] = useState<PathFrame[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEED_DEFAULT_MS);

  const { nodes, edges } = graph;
  const nodeIds = nodes.map((node) => node.id);

  useEffect(() => {
    document.title = dictionary.brand.titled(algorithm.heading);
  }, [algorithm.heading, dictionary]);

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

  function reset(update: () => void) {
    setPlaying(false);
    setFrames(null);
    setCursor(0);
    update();
  }

  function deal(nextCount: number, nextNegative: boolean) {
    const useNegative = Boolean(nextNegative) && Boolean(algorithm.allowsNegative);
    const built = randomGraph({ count: nextCount, negative: useNegative });
    const ids = built.nodes.map((node) => node.id);
    const nextStart = ids.includes(start) ? start : ids[0];
    const fallbackGoal = [...ids].reverse().find((id) => id !== nextStart);
    const nextGoal = (ids.includes(goal) && goal !== nextStart ? goal : fallbackGoal) ?? ids[0];
    setPlaying(false);
    setFrames(null);
    setCursor(0);
    setCount(nextCount);
    setNegative(useNegative);
    setGraph(built);
    setStart(nextStart);
    setGoal(nextGoal);
  }

  function runSearch() {
    const nextFrames = algorithm.run({ nodes, edges, start, goal });
    setFrames(nextFrames);
    setCursor(0);
    setPlaying(nextFrames.length > 1);
  }

  function step(direction: number) {
    if (!frames) return;
    setPlaying(false);
    setCursor((current) => Math.min(frames.length - 1, Math.max(0, current + direction)));
  }

  function togglePlay() {
    if (!frames) {
      runSearch();
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

  const frame: PathFrame = frames?.[cursor] ?? {
    nodeRoles: { [start]: 'start', [goal]: 'goal' },
    edgeRoles: {},
    distances: {},
    queue: [],
    queueLabel: '',
    note: algorithm.idleNote,
    caption: '',
    path: [],
    showDistances: false,
    matrix: null,
  };

  const stepLabel = frames ? dictionary.player.step(cursor + 1, frames.length) : dictionary.player.ready;

  return (
    <div className="sim-layout">
      <section className="bench" aria-label={dictionary.player.simulator(algorithm.heading)}>
        <div className="bench-heading">
          <h1>{algorithm.heading}</h1>
          <p className="blurb">{algorithm.blurb}</p>
        </div>

        <div className="endpoint-row">
          <span>{dictionary.pathfinding.nodes}</span>
          {NODE_COUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className={value === count ? 'button primary' : 'button'}
              disabled={playing}
              onClick={() => deal(value, negative)}
            >
              {value}
            </button>
          ))}
          <button type="button" className="button" disabled={playing} onClick={() => deal(count, negative)}>
            {dictionary.pathfinding.random}
          </button>
          {algorithm.allowsNegative && (
            <button
              type="button"
              className={negative ? 'button primary' : 'button'}
              disabled={playing}
              onClick={() => deal(count, !negative)}
            >
              {dictionary.pathfinding.negative}
            </button>
          )}
        </div>

        <div className="endpoint-row">
          <span>{dictionary.pathfinding.startNode}</span>
          {nodeIds.map((id) => (
            <button
              key={`start-${id}`}
              type="button"
              className={id === start ? 'button primary' : 'button'}
              disabled={playing || id === goal}
              onClick={() => reset(() => setStart(id))}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="endpoint-row">
          <span>{dictionary.pathfinding.goal}</span>
          {nodeIds.map((id) => (
            <button
              key={`goal-${id}`}
              type="button"
              className={id === goal ? 'button primary' : 'button'}
              disabled={playing || id === start}
              onClick={() => reset(() => setGoal(id))}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="chart-stage graph-stage graph-motion">
          {frame.caption && <p className="chart-caption">{frame.caption}</p>}
          <GraphView
            nodes={nodes}
            edges={edges}
            frame={frame}
            start={start}
            goal={goal}
            motion
            pace={speed}
            step={cursor}
            inlineDistances={false}
          />
        </div>
        <div className="graph-memory">
          <DistanceStrip
            nodes={nodes}
            frame={frame}
            start={start}
            goal={goal}
            label={dictionary.pathfinding.distanceRow}
          />
          {frame.queueLabel && (
            <QueueStrip
              label={frame.queueLabel}
              items={frame.queue}
              empty={dictionary.pathfinding.emptyQueue}
              motion={Boolean(frames)}
            />
          )}
          <DistanceMatrix matrix={frame.matrix} motion={Boolean(frames)} />
        </div>

        <ul className="legend">
          {dictionary.pathfinding.legend.map(([tone, label]) => (
            <li key={tone}><i data-tone={tone} />{label}</li>
          ))}
        </ul>

        <div className="step-note" aria-live="polite">
          <span>{stepLabel}</span>
          <p>{frame.note}</p>
        </div>

        <div className="transport">
          <button type="button" className="button primary sort-go" onClick={runSearch}>
            {dictionary.player.run}
          </button>
          <button type="button" className="icon-button" onClick={() => step(-1)} disabled={!frames} aria-label={dictionary.player.previous}>
            <LuSkipBack />
          </button>
          <button type="button" className="icon-button" onClick={togglePlay} aria-label={playing ? dictionary.player.pause : dictionary.player.play}>
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
