import { formatNum, range, snapshot } from './frame';

export function quickSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
  const sorted: number[] = [];
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
    note: 'Quick sort picks a pivot and partitions the range around it. Smaller values go left, larger values go right, and the pivot ends in its final place.',
  }));

  function partition(lo: number, hi: number) {
    const pivot = arr[hi];
    frames.push(snapshot(arr, {
      sorted,
      roles: { [hi]: 'pivot' },
      note: `Use ${formatNum(pivot)} at index ${hi} as the pivot for indexes ${lo}–${hi}.`,
    }));

    let store = lo;
    for (let j = lo; j < hi; j += 1) {
      const smaller = arr[j] < pivot;
      frames.push(snapshot(arr, {
        sorted,
        roles: {
          [j]: 'compare',
          [hi]: 'pivot',
          ...(store !== j && store !== hi ? { [store]: 'min' } : {}),
        },
        note: smaller
          ? `${formatNum(arr[j])} is smaller than the pivot, so it belongs in the left group.`
          : `${formatNum(arr[j])} is greater than or equal to the pivot, so it stays in the right group.`,
      }));

      if (smaller) {
        if (store !== j) {
          [arr[store], arr[j]] = [arr[j], arr[store]];
          frames.push(snapshot(arr, {
            sorted,
            roles: { [store]: 'swap', [j]: 'swap', [hi]: 'pivot' },
            note: `Swap indexes ${store} and ${j}. The left group grows by one.`,
          }));
        }
        store += 1;
      }
    }

    if (store !== hi) {
      [arr[store], arr[hi]] = [arr[hi], arr[store]];
    }

    frames.push(snapshot(arr, {
      sorted: [...sorted, store],
      roles: { [store]: 'pivot' },
      note: `Drop the pivot at index ${store}. Values to the left are smaller. Values to the right are greater or equal. This index is finished.`,
    }));
    return store;
  }

  function sort(lo: number, hi: number) {
    if (lo > hi) return;
    if (lo === hi) {
      if (!sorted.includes(lo)) sorted.push(lo);
      frames.push(snapshot(arr, {
        sorted,
        note: `Index ${lo} (${formatNum(arr[lo])}) is alone in its range, so it is already in its final place.`,
      }));
      return;
    }

    const pivotIndex = partition(lo, hi);
    if (!sorted.includes(pivotIndex)) sorted.push(pivotIndex);
    sort(lo, pivotIndex - 1);
    sort(pivotIndex + 1, hi);
  }

  sort(0, n - 1);
  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'Every pivot is in its final place, so the array is sorted.',
  }));
  return frames;
}
