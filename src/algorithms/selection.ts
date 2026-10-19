import { formatNum, range, snapshot } from './frame';

export function selectionSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
  const sorted = [];
  const n = arr.length;

  if (n <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, n),
      note: n === 0
        ? 'There is nothing to sort.'
        : 'A single value is already in its final place.',
    }));
    return frames;
  }

  frames.push(snapshot(arr, {
    note: 'Selection sort grows a sorted prefix. Each pass finds the smallest remaining value and swaps it into the next open slot.',
  }));

  for (let i = 0; i < n; i += 1) {
    let min = i;
    frames.push(snapshot(arr, {
      sorted,
      roles: { [i]: 'min' },
      note: `Pass ${i + 1}. Start at index ${i} (${formatNum(arr[i])}) and treat it as the smallest value still unsorted.`,
    }));

    for (let j = i + 1; j < n; j += 1) {
      const better = arr[j] < arr[min];
      frames.push(snapshot(arr, {
        sorted,
        roles: { [j]: 'compare', [min]: 'min' },
        note: better
          ? `${formatNum(arr[j])} is smaller than ${formatNum(arr[min])}. Index ${j} is the new minimum.`
          : `${formatNum(arr[j])} is not smaller than ${formatNum(arr[min])}. The minimum stays at index ${min}.`,
      }));
      if (better) min = j;
    }

    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      frames.push(snapshot(arr, {
        sorted,
        roles: { [i]: 'swap', [min]: 'swap' },
        note: `Swap indexes ${i} and ${min}. ${formatNum(arr[i])} is now in its final place.`,
      }));
    } else {
      frames.push(snapshot(arr, {
        sorted,
        roles: { [i]: 'sorted' },
        note: `${formatNum(arr[i])} was already the smallest remaining value, so index ${i} does not move.`,
      }));
    }
    sorted.push(i);
  }

  frames.push(snapshot(arr, {
    sorted,
    note: 'The sorted prefix covers the whole array. Selection sort is finished.',
  }));
  return frames;
}
