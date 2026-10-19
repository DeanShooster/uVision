import { describe, expect, it } from 'vitest';
import { algorithms } from './catalog';

function finalValues(id: string, input: number[]) {
  const algorithm = algorithms.find((item) => item.id === id);
  if (!algorithm) throw new Error(`Missing sort ${id}`);
  const frames = algorithm.sort(input);
  return frames[frames.length - 1].values;
}

function sorted(input: number[]) {
  return [...input].sort((a, b) => a - b);
}

const comparisonCases = [
  [4, 1, 3, 2],
  [5, 5, 1, 5, 2],
  [1],
  [9, 8, 7, 6, 5, 4],
  [1, 2, 3, 4, 5],
  [42],
  [8, 3, 8, 1, 8, 2],
];

describe('sorting frames', () => {
  algorithms.forEach((algorithm) => {
    it(`${algorithm.id} sorts its textbook example`, () => {
      const result = finalValues(algorithm.id, algorithm.example);
      expect(result).toEqual(sorted(algorithm.example));
      expect(result.every((value) => value != null)).toBe(true);
    });

    it(`${algorithm.id} produces a note on every frame`, () => {
      const frames = algorithm.sort(algorithm.example);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.length).toBeLessThan(4000);
      frames.forEach((frame) => {
        expect(frame.note.length).toBeGreaterThan(8);
        expect(frame.values.length).toBe(algorithm.example.length);
      });
    });
  });

  ['selection', 'insertion', 'bubble', 'merge', 'quick', 'heap'].forEach((id) => {
    it(`${id} sorts comparison cases`, () => {
      comparisonCases.forEach((input) => {
        expect(finalValues(id, input)).toEqual(sorted(input));
      });
    });
  });

  it('merge sort keeps every value on the chart while it merges', () => {
    const merge = algorithms.find((item) => item.id === 'merge');
    if (!merge) throw new Error('Missing merge sort');
    [[38, 27, 43, 3, 9, 82, 10, 15], [5, 5, 1, 5, 2], [4, 1, 3, 2]].forEach((input) => {
      const signature = [...input].sort((a, b) => a - b).join(',');
      merge.sort(input).forEach((frame) => {
        const values = frame.values.filter((value): value is number => value != null);
        expect(values).toHaveLength(input.length);
        expect([...values].sort((a, b) => a - b).join(',')).toBe(signature);
      });
    });
  });

  it('counting sort places digits and rejects a value outside 0-9', () => {
    expect(finalValues('counting', [4, 1, 3, 1, 0, 9, 2])).toEqual([0, 1, 1, 2, 3, 4, 9]);
    const counting = algorithms.find((item) => item.id === 'counting');
    if (!counting) throw new Error('Missing counting sort');
    const invalid = counting.sort([4, 12]);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].values).toEqual([4, 12]);
  });

  it('bucket sort orders fractions in [0, 1)', () => {
    const input = [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68];
    expect(finalValues('bucket', input)).toEqual(sorted(input));
  });

  it('radix sort orders integers with different digit lengths', () => {
    expect(finalValues('radix', [170, 45, 75, 90, 802, 24, 2, 66])).toEqual(
      [2, 24, 45, 66, 75, 90, 170, 802],
    );
  });
});
