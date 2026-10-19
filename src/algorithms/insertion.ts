import { formatNum, range, snapshot } from './frame';

export function insertionSort(input: number[]) {
  const arr = input.map(Number);
  const frames = [];
  const n = arr.length;

  if (n <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, n),
      note: n === 0
        ? 'There is nothing to sort.'
        : 'A single value is already a sorted list.',
    }));
    return frames;
  }

  frames.push(snapshot(arr, {
    sorted: [0],
    note: 'Treat the first value as a sorted hand of one card. Each next value is inserted into that hand.',
  }));

  for (let i = 1; i < n; i += 1) {
    const current = arr[i];
    let j = i - 1;

    frames.push(snapshot(arr, {
      sorted: range(0, i),
      roles: { [i]: 'read' },
      note: `Pick up ${formatNum(current)} from index ${i}. Shift any larger sorted values one step right to open a gap.`,
    }));

    while (j >= 0 && arr[j] > current) {
      const shifted = arr[j];
      arr[j + 1] = shifted;
      arr[j] = current;
      frames.push(snapshot(arr, {
        sorted: range(0, i).filter((index) => index !== j && index !== j + 1),
        roles: { [j]: 'swap', [j + 1]: 'swap' },
        note: `${formatNum(shifted)} swaps with ${formatNum(current)} and moves one position right.`,
      }));
      j -= 1;
    }

    arr[j + 1] = current;
    const stayed = j + 1 === i;
    frames.push(snapshot(arr, {
      sorted: range(0, i + 1),
      roles: { [j + 1]: 'write' },
      note: stayed
        ? `${formatNum(current)} is already in order, so it stays at index ${i}.`
        : j < 0
          ? `${formatNum(current)} is smaller than the whole sorted region, so it is placed at index 0.`
          : `Place ${formatNum(current)} at index ${j + 1}, just after ${formatNum(arr[j])}. Equal values are not shifted, so their original order stays.`,
    }));
  }

  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'Every value has been inserted. The array is sorted.',
  }));
  return frames;
}
