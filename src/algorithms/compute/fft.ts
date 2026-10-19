import { formatComplex } from './format';
import type { Complex, FftFrame, FftLink } from './types';

const SIZE = 8;
const BITS = 3;

function bitReverse(index: number) {
  let reversed = 0;
  let value = index;
  for (let bit = 0; bit < BITS; bit += 1) {
    reversed = (reversed << 1) | (value & 1);
    value >>= 1;
  }
  return reversed;
}

function clone(value: Complex): Complex {
  return { re: value.re, im: value.im };
}

function add(left: Complex, right: Complex): Complex {
  return { re: left.re + right.re, im: left.im + right.im };
}

function sub(left: Complex, right: Complex): Complex {
  return { re: left.re - right.re, im: left.im - right.im };
}

function mul(left: Complex, right: Complex): Complex {
  return {
    re: left.re * right.re - left.im * right.im,
    im: left.re * right.im + left.im * right.re,
  };
}

function emptyColumns(history: Complex[][], partial?: (Complex | null)[]) {
  const columns: (Complex | null)[][] = [];
  for (let column = 0; column <= BITS; column += 1) {
    const stored = history[column];
    if (stored) columns.push(stored.map(clone));
    else if (partial && column === history.length) columns.push(partial.map((value) => (value ? clone(value) : null)));
    else columns.push(Array.from({ length: SIZE }, () => null));
  }
  return columns;
}

export function fft(samples: number[]) {
  const input = samples.slice(0, SIZE).map((value) => Math.trunc(value));
  while (input.length < SIZE) input.push(0);
  const order = Array.from({ length: SIZE }, (_, index) => bitReverse(index));
  let values: Complex[] = order.map((index) => ({ re: input[index] ?? 0, im: 0 }));
  const history: Complex[][] = [values.map(clone)];
  const links: FftLink[] = [];
  const frames: FftFrame[] = [{
    kind: 'fft',
    caption: 'Bit-reversed input',
    note: `The samples are reordered to ${order.map((index) => input[index] ?? 0).join(', ')}. The numbers on the left are their original positions. Each next step reads two rows: add a turned copy of the lower value to the upper value, and subtract that same copy for the other result.`,
    columns: emptyColumns(history),
    links: [],
    order,
    done: false,
  }];

  for (let length = 2, stage = 0; length <= SIZE; length *= 2, stage += 1) {
    const next = values.map(clone);
    const shown: (Complex | null)[] = Array.from({ length: SIZE }, () => null);
    const half = length / 2;
    const angle = (-2 * Math.PI) / length;
    for (let start = 0; start < SIZE; start += length) {
      for (let offset = 0; offset < half; offset += 1) {
        const twiddle = { re: Math.cos(angle * offset), im: Math.sin(angle * offset) };
        const top = start + offset;
        const bottom = top + half;
        const upper = values[top];
        const lower = values[bottom];
        const product = mul(twiddle, lower);
        next[top] = add(upper, product);
        next[bottom] = sub(upper, product);
        shown[top] = clone(next[top]);
        shown[bottom] = clone(next[bottom]);
        links.forEach((link) => {
          link.active = false;
        });
        links.push({ fromCol: stage, top, bottom, active: true });
        const apart = half === 1 ? 'neighbors' : `rows ${half} apart`;
        frames.push({
          kind: 'fft',
          caption: `Combine ${formatComplex(upper)} and ${formatComplex(lower)}`,
          note: stepNote(upper, lower, twiddle, product, next[top], next[bottom], apart),
          columns: emptyColumns(history, shown),
          links: links.map((link) => ({ ...link })),
          order,
          done: false,
        });
      }
    }
    values = next;
    history.push(values.map(clone));
  }

  const last = frames[frames.length - 1];
  frames.push({
    kind: 'fft',
    caption: 'Spectrum',
    note: `The green column is the spectrum, frequency 0 at the top through frequency 7 at the bottom. ${formatComplex(values[0])} is the sum of the samples. The lower half mirrors the upper half because every sample was a real number.`,
    columns: emptyColumns(history),
    links: last ? last.links.map((link) => ({ ...link, active: false })) : [],
    order,
    done: true,
  });
  return frames;
}

function stepNote(
  upper: Complex,
  lower: Complex,
  twiddle: Complex,
  product: Complex,
  sum: Complex,
  difference: Complex,
  apart: string,
) {
  const turn = formatComplex(twiddle);
  if (turn === '1') {
    return `These two are ${apart}, and the turn is 1, so the lower value is used as it is. ${formatComplex(upper)} + ${formatComplex(lower)} = ${formatComplex(sum)}, and ${formatComplex(upper)} − ${formatComplex(lower)} = ${formatComplex(difference)}.`;
  }
  return `These two are ${apart}. The turn is ${turn}, and ${turn} × ${formatComplex(lower)} = ${formatComplex(product)}. Add that to ${formatComplex(upper)} and write ${formatComplex(sum)}. Subtract it and write ${formatComplex(difference)}.`;
}

export function naiveDft(samples: number[]): Complex[] {
  return samples.map((_, bin) => {
    let re = 0;
    let im = 0;
    samples.forEach((sample, time) => {
      const angle = (-2 * Math.PI * bin * time) / samples.length;
      re += sample * Math.cos(angle);
      im += sample * Math.sin(angle);
    });
    return { re, im };
  });
}
