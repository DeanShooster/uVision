import { useEffect, useState, type ChangeEvent } from 'react';
import { HiPause, HiPlay } from 'react-icons/hi2';
import { LuRotateCcw, LuSkipBack, LuSkipForward } from 'react-icons/lu';
import { parseAlgorithmInput, PRESET_NAMES } from '../../algorithms/catalog';
import type { PresetId, SortAlgorithm, SortFrame } from '../../algorithms/types';
import {
  PLAYBACK_SPEED_DEFAULT_MS,
  PLAYBACK_SPEED_MAX_MS,
  PLAYBACK_SPEED_MIN_MS,
  PLAYBACK_SPEED_SLIDER_SPAN,
} from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { usePlaybackKeys } from '../../hooks/usePlaybackKeys';
import Auxiliary from './Auxiliary';
import BarChart from './BarChart';
import Explanation from './Explanation';
import HeapTree from './HeapTree';

function constraintHint(algorithm: SortAlgorithm, wholeNumbers: string, numbers: string, format: (maxLength: number, kind: string, min: number, max: number) => string) {
  const { integer, min, max, maxLength } = algorithm.constraints;
  return format(maxLength, integer ? wholeNumbers : numbers, min, max);
}

export default function Simulator({ algorithm }: { algorithm: SortAlgorithm }) {
  const dictionary = useDictionary();
  const [array, setArray] = useState(algorithm.example);
  const [draft, setDraft] = useState(algorithm.example.join(', '));
  const [frames, setFrames] = useState<SortFrame[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEED_DEFAULT_MS);

  useEffect(() => {
    setArray(algorithm.example);
    setDraft(algorithm.example.join(', '));
    setFrames(null);
    setCursor(0);
    setPlaying(false);
  }, [algorithm]);

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
    document.title = dictionary.brand.titled(dictionary.sorting.documentName(algorithm.name));
  }, [algorithm.name, dictionary]);

  const frame = frames?.[cursor] ?? {
    values: array,
    roles: {},
    sorted: [],
    note: dictionary.sorting.idleNote,
    caption: '',
    aux: null,
    shape: algorithm.id === 'heap' ? 'array' : undefined,
  };

  function stopAnd(update: () => void) {
    setPlaying(false);
    setFrames(null);
    setCursor(0);
    update();
  }

  function onDraftChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = event.target.value;
    setDraft(nextDraft);
    stopAnd(() => {
      setArray(parseAlgorithmInput(nextDraft, algorithm));
    });
  }

  function applyPreset(presetId: PresetId) {
    const next = algorithm.presets[presetId]();
    setDraft(next.join(', '));
    stopAnd(() => setArray(next));
  }

  function runSort() {
    if (array.length === 0) return;
    const nextFrames = algorithm.sort(array);
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
      runSort();
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

  const stepLabel = frames
    ? dictionary.player.step(cursor + 1, frames.length)
    : dictionary.player.ready;

  return (
    <div className="sim-layout">
      <section className="bench" aria-label={dictionary.player.simulator(dictionary.sorting.heading(algorithm.name))}>
        <div className="bench-heading">
          <h1>{dictionary.sorting.heading(algorithm.name)}</h1>
          <p className="blurb">{algorithm.blurb}</p>
        </div>

        <div className="preset-row">
          {PRESET_NAMES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="button"
              disabled={playing}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="array-field">
          <span>{dictionary.sorting.array}</span>
          <input
            value={draft}
            onChange={onDraftChange}
            disabled={playing}
            inputMode="decimal"
            placeholder={algorithm.constraints.placeholder}
            aria-describedby="array-hint"
          />
        </label>
        <p id="array-hint" className="hint">{constraintHint(algorithm, dictionary.sorting.wholeNumbers, dictionary.sorting.numbers, dictionary.sorting.constraint)}</p>

        <div className="chart-stage">
          {frame.caption && <p className="chart-caption">{frame.caption}</p>}
          {array.length === 0
            ? <p className="empty-chart">{dictionary.sorting.empty}</p>
            : algorithm.id === 'heap'
              ? <HeapTree frame={frame} motion pace={speed} />
              : <BarChart frame={frame} motion pace={speed} />}
          <Auxiliary aux={frame.aux} />
        </div>

        <ul className="legend">
          {dictionary.sorting.legend.map(([tone, label]) => (
            <li key={tone}><i data-tone={tone} />{label}</li>
          ))}
        </ul>

        <div className="step-note" aria-live="polite">
          <span>{stepLabel}</span>
          <p>{frame.note}</p>
        </div>

        <div className="transport">
          <button type="button" className="button primary sort-go" onClick={runSort} disabled={array.length === 0}>
            {dictionary.player.sort}
          </button>
          <button type="button" className="icon-button" onClick={() => step(-1)} disabled={!frames} aria-label={dictionary.player.previous}>
            <LuSkipBack />
          </button>
          <button type="button" className="icon-button" onClick={togglePlay} disabled={array.length === 0} aria-label={playing ? dictionary.player.pause : dictionary.player.play}>
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
