import { formatNum, range, snapshot } from './frame';
import type { CountAux } from './types';

const RANGE = 10;

export function countingSort(input: number[]) {
  const arr = input.map((value) => Math.trunc(Number(value)));
  const frames = [];

  if (arr.some((value) => value < 0 || value >= RANGE)) {
    frames.push(snapshot(arr, {
      note: 'This counting sort only accepts integers from 0 through 9, because the count table has one slot per possible value.',
    }));
    return frames;
  }

  const count: number[] = Array(RANGE).fill(0);
  const aux = (active: number | null): CountAux => ({
    kind: 'count',
    label: 'Count table',
    cells: [...count],
    active,
  });

  if (arr.length <= 1) {
    frames.push(snapshot(arr, {
      sorted: range(0, arr.length),
      aux: aux(null),
      note: arr.length === 0
        ? 'There is nothing to sort.'
        : 'A single value is already in its final place.',
    }));
    return frames;
  }

  frames.push(snapshot(arr, {
    caption: 'Input',
    aux: aux(null),
    note: 'Counting sort does not compare values. It counts how often each integer from 0 to 9 appears, then writes the values back in order.',
  }));

  for (let index = 0; index < arr.length; index += 1) {
    const value = arr[index];
    count[value] += 1;
    frames.push(snapshot(arr, {
      caption: 'Input',
      roles: { [index]: 'read' },
      aux: aux(value),
      note: `Read ${formatNum(value)} at index ${index}. The count for ${formatNum(value)} is now ${count[value]}.`,
    }));
  }

  for (let value = 1; value < RANGE; value += 1) {
    count[value] += count[value - 1];
    frames.push(snapshot(arr, {
      caption: 'Input',
      aux: aux(value),
      note: `Turn counts into positions. The table slot ${value} becomes ${count[value]}, the number of values that are ${value} or smaller.`,
    }));
  }

  const output = Array(arr.length).fill(null);
  for (let index = arr.length - 1; index >= 0; index -= 1) {
    const value = arr[index];
    count[value] -= 1;
    const destination = count[value];
    output[destination] = value;
    frames.push(snapshot(output, {
      caption: 'Output',
      roles: { [destination]: 'write' },
      aux: aux(value),
      note: `Place the ${formatNum(value)} from input index ${index} into output index ${destination}. Walking the input from the right keeps equal values in their original order.`,
    }));
  }

  frames.push(snapshot(output, {
    caption: 'Output',
    sorted: range(0, output.length),
    aux: aux(null),
    note: 'Every value has been written into the slot reserved by the count table. The output is sorted.',
  }));
  return frames;
}
