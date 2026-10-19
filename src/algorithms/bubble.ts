import { formatNum, range, snapshot } from './frame';

export function bubbleSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
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
    note: 'Bubble sort walks adjacent pairs. When a pair is out of order it swaps, so larger values drift toward the end.',
  }));

  for (let pass = 0; pass < n - 1; pass += 1) {
    let swapped = false;
    const locked = range(n - pass, n);

    for (let j = 0; j < n - pass - 1; j += 1) {
      const outOfOrder = arr[j] > arr[j + 1];
      frames.push(snapshot(arr, {
        sorted: locked,
        roles: { [j]: 'compare', [j + 1]: 'compare' },
        note: outOfOrder
          ? `${formatNum(arr[j])} is greater than ${formatNum(arr[j + 1])}, so this pair will swap.`
          : `${formatNum(arr[j])} and ${formatNum(arr[j + 1])} are already in order. Leave them.`,
      }));

      if (outOfOrder) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        frames.push(snapshot(arr, {
          sorted: locked,
          roles: { [j]: 'swap', [j + 1]: 'swap' },
          note: `Swap them. ${formatNum(arr[j + 1])} moves one step closer to its final place.`,
        }));
      }
    }

    const sorted = range(n - pass - 1, n);
    frames.push(snapshot(arr, {
      sorted,
      note: `Pass ${pass + 1} is done. ${formatNum(arr[n - pass - 1])} has bubbled to index ${n - pass - 1} and will not move again.`,
    }));

    if (!swapped) {
      frames.push(snapshot(arr, {
        sorted: range(0, n),
        note: 'This pass made no swaps, so every remaining value is already in order. Bubble sort can stop early.',
      }));
      return frames;
    }
  }

  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'The last value is in place. The array is sorted.',
  }));
  return frames;
}
