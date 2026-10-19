import { describe, expect, it } from 'vitest';
import { euclidean } from './euclidean';
import { fft, naiveDft } from './fft';
import { DAMPING, pageRank, parseRankValues, randomRankGraph, RANK_EDGES, RANK_PAGES, ringGraph, TEXTBOOK_GRAPH } from './pageRank';
import type { FftFrame } from './types';

function lastEuclid(a: number, b: number) {
  const frames = euclidean(a, b);
  return frames[frames.length - 1];
}

describe('computations', () => {
  it('finds the greatest common divisor', () => {
    expect(lastEuclid(48, 18)?.a).toBe(6);
    expect(lastEuclid(48, 18)?.done).toBe(true);
    expect(lastEuclid(18, 48)?.a).toBe(6);
    expect(lastEuclid(1071, 462)?.a).toBe(21);
    expect(lastEuclid(17, 17)?.a).toBe(17);
    expect(lastEuclid(0, 5)?.a).toBe(5);
    expect(euclidean(48, 18).some((frame) => frame.note.includes('48 = 2 × 18 + 12'))).toBe(true);
  });

  it('matches a direct Fourier transform', () => {
    for (const samples of [[1, 2, 3, 4, 5, 6, 7, 8], [1, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1]]) {
      const frames = fft(samples);
      const last = frames[frames.length - 1] as FftFrame;
      const column = last.columns[last.columns.length - 1];
      const expected = naiveDft(samples);
      expected.forEach((value, index) => {
        expect(column[index]?.re).toBeCloseTo(value.re, 6);
        expect(column[index]?.im).toBeCloseTo(value.im, 6);
      });
      expect(last.done).toBe(true);
    }
  });

  it('matches an independent PageRank pass', () => {
    const count = RANK_PAGES.length;
    const teleport = (1 - DAMPING) / count;
    let scores = Array.from({ length: count }, () => 1 / count);
    for (let pass = 1; pass <= 6; pass += 1) {
      const next = Array.from({ length: count }, () => teleport);
      scores.forEach((score, index) => {
        const links = RANK_EDGES.filter((edge) => edge.from === index);
        const amount = (DAMPING * score) / links.length;
        links.forEach((edge) => {
          next[edge.to] += amount;
        });
      });
      const previous = scores;
      scores = next;
      const change = Math.max(...next.map((value, index) => Math.abs(value - (previous[index] ?? 0))));
      if (change < 0.01 || pass === 6) break;
    }
    const frame = pageRank()[pageRank().length - 1];
    frame?.scores.forEach((score, index) => {
      expect(score).toBeCloseTo(scores[index] ?? 0, 6);
    });
    expect(frame?.scores.reduce((sum, score) => sum + score, 0)).toBeCloseTo(1, 6);
    expect(frame?.done).toBe(true);
  });

  it('scales typed PageRank values and keeps a new graph closed', () => {
    expect(parseRankValues('1, 1, 1, 3', 4)).toEqual([1, 1, 1, 3]);
    expect(parseRankValues('1, 2', 4)).toBeNull();
    expect(parseRankValues('0, 0, 0', 3)).toBeNull();
    const opening = pageRank(TEXTBOOK_GRAPH, [1, 1, 1, 3])[0];
    expect(opening?.scores[0]).toBeCloseTo(1 / 6, 6);
    expect(opening?.scores[3]).toBeCloseTo(0.5, 6);

    const ring = ringGraph(6);
    ring.pages.forEach((_, index) => {
      expect(ring.edges.some((edge) => edge.from === index)).toBe(true);
    });
    const ringLast = pageRank(ring)[pageRank(ring).length - 1];
    expect(ringLast?.scores.reduce((sum, score) => sum + score, 0)).toBeCloseTo(1, 6);
    expect(ringLast?.done).toBe(true);

    for (let sample = 0; sample < 8; sample += 1) {
      const graph = randomRankGraph(3 + (sample % 6));
      graph.pages.forEach((_, index) => {
        expect(graph.edges.some((edge) => edge.from === index)).toBe(true);
      });
      const frames = pageRank(graph, graph.pages.map(() => 1 + (sample % 4)));
      const last = frames[frames.length - 1];
      expect(last?.scores.reduce((sum, score) => sum + score, 0)).toBeCloseTo(1, 6);
    }
  });
});
