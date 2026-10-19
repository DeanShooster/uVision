import { formatNum, range, snapshot } from './frame';
import type { BucketAux } from './types';

const BUCKETS = 10;

function bucketAux(buckets: number[][], active: number | null, label: string): BucketAux {
  return {
    kind: 'buckets',
    label,
    buckets: buckets.map((bucket) => [...bucket]),
    active,
  };
}

export function bucketSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
  const n = arr.length;

  if (arr.some((value) => value < 0 || value >= 1)) {
    frames.push(snapshot(arr, {
      note: 'This bucket sort expects values from 0 up to, but not including, 1. Each value is scattered into one of ten equal ranges.',
    }));
    return frames;
  }

  const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);

  if (n <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, n),
      aux: bucketAux(buckets, null, 'Buckets'),
      note: n === 0
        ? 'There is nothing to sort.'
        : 'A single value is already in its final place.',
    }));
    return frames;
  }

  frames.push(snapshot(arr, {
    aux: bucketAux(buckets, null, 'Ten buckets, each covering a tenth of the range'),
    note: 'Bucket sort scatters values into ordered buckets, sorts inside each bucket, then concatenates the buckets.',
  }));

  for (let index = 0; index < n; index += 1) {
    const value = arr[index];
    const bucketIndex = Math.min(BUCKETS - 1, Math.floor(value * BUCKETS));
    buckets[bucketIndex].push(value);
    frames.push(snapshot(arr, {
      roles: { [index]: 'read' },
      aux: bucketAux(buckets, bucketIndex, 'Scatter'),
      note: `${formatNum(value)} falls in the range ${bucketIndex / 10}–${(bucketIndex + 1) / 10}, so it goes into bucket ${bucketIndex}.`,
    }));
  }

  for (let bucketIndex = 0; bucketIndex < BUCKETS; bucketIndex += 1) {
    const bucket = buckets[bucketIndex];
    if (bucket.length < 2) continue;

    for (let i = 1; i < bucket.length; i += 1) {
      const current = bucket[i];
      let j = i - 1;
      while (j >= 0 && bucket[j] > current) {
        bucket[j + 1] = bucket[j];
        j -= 1;
      }
      bucket[j + 1] = current;
      frames.push(snapshot(arr, {
        aux: bucketAux(buckets, bucketIndex, 'Sort inside the bucket'),
        note: `Insertion-sort bucket ${bucketIndex}: ${formatNum(current)} settles inside that bucket. A bucket only holds a small slice of the range, so this work stays local.`,
      }));
    }
  }

  const output = Array(n).fill(null);
  let writeIndex = 0;
  for (let bucketIndex = 0; bucketIndex < BUCKETS; bucketIndex += 1) {
    while (buckets[bucketIndex].length > 0) {
      const value = buckets[bucketIndex].shift();
      output[writeIndex] = value;
      frames.push(snapshot(output, {
        caption: 'Collected',
        roles: { [writeIndex]: 'write' },
        aux: bucketAux(buckets, bucketIndex, 'Concatenate buckets from 0 to 9'),
        note: `Take ${formatNum(value)} from bucket ${bucketIndex} and write it at index ${writeIndex}. Buckets are already in range order, so the result grows sorted.`,
      }));
      writeIndex += 1;
    }
  }

  frames.push(snapshot(output, {
    caption: 'Collected',
    sorted: range(0, n),
    aux: bucketAux(buckets, null, 'Buckets empty'),
    note: 'The buckets have been concatenated. The array is sorted.',
  }));
  return frames;
}
