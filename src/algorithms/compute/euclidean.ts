import type { EuclideanFrame } from './types';

function frame(
  fields: Omit<EuclideanFrame, 'kind'>,
): EuclideanFrame {
  return { kind: 'euclidean', ...fields };
}

export function euclidean(rawA: number, rawB: number) {
  let a = Math.abs(Math.trunc(rawA));
  let b = Math.abs(Math.trunc(rawB));
  const scale = Math.max(a, b, 1);
  const frames: EuclideanFrame[] = [];
  const blank = {
    scale,
    quotient: null,
    remainder: null,
    dividend: null,
    divisor: null,
  };

  if (a === 0 && b === 0) {
    frames.push(frame({
      ...blank,
      a,
      b,
      done: false,
      caption: 'Undefined',
      note: 'Both numbers are 0. Every integer divides 0, so there is no greatest one.',
    }));
    return frames;
  }

  if (a < b) {
    frames.push(frame({
      ...blank,
      a,
      b,
      done: false,
      caption: 'Order the pair',
      note: `${b} is larger than ${a}, so the larger one becomes a and ${a} becomes b.`,
    }));
    [a, b] = [b, a];
  }

  if (b === 0) {
    frames.push(frame({
      ...blank,
      a,
      b,
      done: true,
      caption: `gcd = ${a}`,
      note: `One number is already 0, so the greatest common divisor is ${a}.`,
    }));
    return frames;
  }

  frames.push(frame({
    ...blank,
    a,
    b,
    done: false,
    caption: 'Start',
    note: `Start with a = ${a} and b = ${b}. Divide a by b and keep the remainder.`,
  }));

  while (b !== 0) {
    const quotient = Math.floor(a / b);
    const remainder = a - quotient * b;
    const dividend = a;
    const divisor = b;
    const product = quotient * divisor;
    frames.push(frame({
      scale,
      a: dividend,
      b: divisor,
      quotient,
      remainder,
      dividend,
      divisor,
      done: false,
      caption: `${dividend} ÷ ${divisor}`,
      note: `${dividend} = ${quotient} × ${divisor} + ${remainder}, because ${quotient} × ${divisor} = ${product} and ${dividend} − ${product} = ${remainder}.`,
    }));
    a = divisor;
    b = remainder;
    const finished = b === 0;
    frames.push(frame({
      scale,
      a,
      b,
      quotient,
      remainder,
      dividend,
      divisor,
      done: finished,
      caption: finished ? `gcd = ${a}` : 'Replace the pair',
      note: finished
        ? `The remainder is 0, so ${divisor} divides ${dividend} exactly. The greatest common divisor is ${a}.`
        : `${divisor} becomes the new a, and the remainder ${remainder} becomes the new b.`,
    }));
  }

  return frames;
}
