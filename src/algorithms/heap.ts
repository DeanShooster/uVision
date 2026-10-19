import { formatNum, range, snapshot } from './frame';

export function heapSort(input: number[]) {
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
    shape: 'array',
    note: 'Start with the values in array order. Index 0 is on the left, and each next index is one step to the right.',
  }));
  frames.push(snapshot(arr, {
    shape: 'heap',
    note: 'Fold that row into a tree. The parent at index i sits above the children at 2i+1 and 2i+2. The largest value will be moved to index 0.',
  }));

  function heapify(heapSize: number, index: number) {
    const left = 2 * index + 1;
    const right = 2 * index + 2;
    if (left >= heapSize) return;

    let largest = index;
    if (arr[left] > arr[largest]) largest = left;
    if (right < heapSize && arr[right] > arr[largest]) largest = right;

    const roles: Partial<Record<number, 'pivot' | 'compare'>> = { [index]: 'pivot', [left]: 'compare' };
    if (right < heapSize) roles[right] = 'compare';

    frames.push(snapshot(arr, {
      sorted,
      roles,
      note: largest === index
        ? `${formatNum(arr[index])} at index ${index} is already at least as large as its children.`
        : `${formatNum(arr[largest])} at index ${largest} is larger than its parent ${formatNum(arr[index])}. They need to swap.`,
    }));

    if (largest !== index) {
      [arr[index], arr[largest]] = [arr[largest], arr[index]];
      frames.push(snapshot(arr, {
        sorted,
        roles: { [index]: 'swap', [largest]: 'swap' },
        note: `Swap the parent at index ${index} with the child at index ${largest}. Then repair the subtree that received the smaller value.`,
      }));
      heapify(heapSize, largest);
    }
  }

  for (let index = Math.floor(n / 2) - 1; index >= 0; index -= 1) {
    heapify(n, index);
  }

  frames.push(snapshot(arr, {
    roles: { 0: 'pivot' },
    note: 'The array is now a max-heap. Repeatedly move the root to the end and repair the heap that remains.',
  }));

  for (let end = n - 1; end > 0; end -= 1) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    sorted.push(end);
    frames.push(snapshot(arr, {
      sorted,
      roles: { 0: 'swap', [end]: 'sorted' },
      note: `Move ${formatNum(arr[end])} from the root to index ${end}. It leaves the tree and is finished. The heap is now indexes 0–${end - 1}.`,
    }));
    heapify(end, 0);
  }

  sorted.push(0);
  frames.push(snapshot(arr, {
    sorted: range(0, n),
    note: 'The last value is the smallest and already sits at index 0. The array is sorted.',
  }));
  return frames;
}
