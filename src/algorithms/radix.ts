import { formatNum, range, snapshot } from './frame';
import type { BucketAux } from './types';

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];

function digitAt(value: number, place: number) {
  return Math.floor(Math.abs(value) / 10 ** place) % 10;
}

function bucketAux(buckets: number[][], active: number | null, label: string): BucketAux {
  return {
    kind: 'buckets',
    label,
    buckets: buckets.map((bucket) => [...bucket]),
    active,
  };
}

export function radixSort(input: number[]) {
  const arr = input.map((value) => Math.trunc(Number(value)));
  const frames = [];
  const n = arr.length;

  if (arr.some((value) => value < 0)) {
    frames.push(snapshot(arr, {
      note: 'This radix sort visualizes non-negative integers. Each pass groups values by one decimal digit.',
    }));
    return frames;
  }

  if (n <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, n),
      note: n === 0
        ? 'There is nothing to sort.'
        : 'A single value is already in its final place.',
    }));
    return frames;
  }

  const max = Math.max(...arr);
  const digits = Math.max(1, String(max).length);

  frames.push(snapshot(arr, {
    note: 'Radix sort sorts one digit at a time, starting at the ones place. Each pass uses ten buckets and must keep the order inside a bucket, so later passes do not undo earlier ones.',
  }));

  for (let place = 0; place < digits; place += 1) {
    const placeName = PLACE_NAMES[place] ?? `10^${place}`;
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    frames.push(snapshot(arr, {
      aux: bucketAux(buckets, null, `${placeName} place`),
      note: `Pass ${place + 1} of ${digits}. Group every value by its ${placeName} digit.`,
    }));

    for (let index = 0; index < n; index += 1) {
      const value = arr[index];
      const digit = digitAt(value, place);
      buckets[digit].push(value);
      frames.push(snapshot(arr, {
        roles: { [index]: 'read' },
        aux: bucketAux(buckets, digit, `${placeName} place`),
        note: `${formatNum(value)} has ${placeName} digit ${digit}, so it joins bucket ${digit}. Values already in that bucket stay ahead of it.`,
      }));
    }

    const output = Array(n).fill(null);
    let writeIndex = 0;
    for (let digit = 0; digit < 10; digit += 1) {
      while (buckets[digit].length > 0) {
        const value = buckets[digit].shift();
        output[writeIndex] = value;
        frames.push(snapshot(output, {
          caption: `After the ${placeName} pass`,
          roles: { [writeIndex]: 'write' },
          aux: bucketAux(buckets, digit, `${placeName} place`),
          note: `Write ${formatNum(value)} from bucket ${digit} to index ${writeIndex}. Collecting buckets from 0 to 9 sorts this digit.`,
        }));
        writeIndex += 1;
      }
    }

    for (let index = 0; index < n; index += 1) arr[index] = output[index];
    frames.push(snapshot(arr, {
      aux: bucketAux(buckets, null, `${placeName} place done`),
      note: place === digits - 1
        ? `The ${placeName} pass was the last digit. The array is sorted.`
        : `The ${placeName} pass is done. The next pass looks at a more significant digit and relies on this order staying stable.`,
    }));
  }

  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'Every digit has been processed, from least significant to most significant. The array is sorted.',
  }));
  return frames;
}
