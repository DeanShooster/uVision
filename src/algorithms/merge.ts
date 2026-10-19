import { formatNum, markRange, range, snapshot } from './frame';

export function mergeSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
  const n = arr.length;

  if (n <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, n),
      note: n === 0
        ? 'There is nothing to sort.'
        : 'A single value is already a sorted run.',
    }));
    return frames;
  }

  frames.push(snapshot(arr, {
    note: 'Merge sort splits the array in half until every run has one value, then merges runs by always taking the smaller front value.',
  }));

  function merge(lo: number, mid: number, hi: number) {
    const left = arr.slice(lo, mid);
    const right = arr.slice(mid, hi);
    let i = 0;
    let j = 0;
    let k = lo;
    let rightIndex = mid;

    frames.push(snapshot(arr, {
      roles: markRange(lo, hi, 'region', { [k]: 'compare', [rightIndex]: 'compare' }),
      note: `Merge the sorted runs at indexes ${lo}–${mid - 1} and ${mid}–${hi - 1}. Compare their front values.`,
    }));

    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        frames.push(snapshot(arr, {
          roles: markRange(lo, hi, 'region', { [k]: 'write', [rightIndex]: 'compare' }),
          note: `${formatNum(left[i])} is less than or equal to ${formatNum(right[j])}, so it stays at index ${k}. On a tie, the left value wins, which keeps the sort stable.`,
        }));
        i += 1;
        k += 1;
      } else {
        const moving = arr[rightIndex];
        const passed = arr.slice(k, rightIndex);
        arr[k] = moving;
        passed.forEach((value, offset) => {
          arr[k + 1 + offset] = value;
        });
        frames.push(snapshot(arr, {
          roles: markRange(lo, hi, 'region', { [k]: 'swap', [k + 1]: 'compare' }),
          note: `${formatNum(moving)} is smaller than ${formatNum(left[i])}, so it moves to index ${k}.`,
        }));
        j += 1;
        k += 1;
        rightIndex += 1;
      }
    }

    if (k < hi) {
      frames.push(snapshot(arr, {
        roles: markRange(lo, hi, 'region'),
        note: i < left.length
          ? 'The right run is empty. The remaining left values are already in place.'
          : 'The left run is empty. The remaining right values are already in place.',
      }));
    }
  }

  function sort(lo: number, hi: number) {
    if (hi - lo <= 1) return;
    const mid = Math.floor((lo + hi) / 2);
    frames.push(snapshot(arr, {
      roles: markRange(lo, hi, 'region'),
      note: `Split indexes ${lo}–${hi - 1} into ${lo}–${mid - 1} and ${mid}–${hi - 1}. Sort the left half first.`,
    }));
    sort(lo, mid);
    sort(mid, hi);
    merge(lo, mid, hi);
  }

  sort(0, n);
  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'The two halves are merged. The array is sorted.',
  }));
  return frames;
}
