import { dictionary } from '../dictionary/dictionary';
import type { PresetId, SortAlgorithm, SortConstraints, SortPresets } from './types';
import { bubbleSort } from './bubble';
import { bucketSort } from './bucket';
import { countingSort } from './counting';
import { heapSort } from './heap';
import { insertionSort } from './insertion';
import { mergeSort } from './merge';
import { quickSort } from './quick';
import { radixSort } from './radix';
import { selectionSort } from './selection';

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffleSome(values: number[], swaps: number) {
  const next = [...values];
  for (let count = 0; count < swaps; count += 1) {
    const left = randomInt(0, next.length - 1);
    const right = randomInt(0, next.length - 1);
    [next[left], next[right]] = [next[right], next[left]];
  }
  return next;
}

function intPresets(length: number, min: number, max: number): SortPresets {
  const sorted = Array.from({ length }, (_, index) => {
    const span = max - min;
    return min + Math.round((span * index) / Math.max(1, length - 1));
  });
  return {
    random: () => Array.from({ length }, () => randomInt(min, max)),
    sorted: () => [...sorted],
    reversed: () => [...sorted].reverse(),
    nearly: () => shuffleSome(sorted, Math.max(2, Math.floor(length / 5))),
    duplicates: () => {
      const choices = [sorted[0], sorted[Math.floor(length / 2)], sorted[length - 1]];
      return Array.from({ length }, () => choices[randomInt(0, choices.length - 1)]);
    },
  };
}

function countingPresets(length: number): SortPresets {
  const sorted = Array.from({ length }, (_, index) => index % 10);
  return {
    random: () => Array.from({ length }, () => randomInt(0, 9)),
    sorted: () => [...sorted].sort((a, b) => a - b),
    reversed: () => [...sorted].sort((a, b) => b - a),
    nearly: () => shuffleSome([...sorted].sort((a, b) => a - b), 2),
    duplicates: () => Array.from({ length }, () => 4),
  };
}

function bucketPresets(length: number): SortPresets {
  const sorted = Array.from({ length }, (_, index) => (
    Math.round(((index + 1) / (length + 1)) * 100) / 100
  ));
  return {
    random: () => Array.from({ length }, () => (
      Math.round((0.05 + Math.random() * 0.9) * 100) / 100
    )),
    sorted: () => [...sorted],
    reversed: () => [...sorted].reverse(),
    nearly: () => shuffleSome(sorted, 2),
    duplicates: () => Array.from({ length }, () => 0.42),
  };
}

function radixPresets(length: number): SortPresets {
  const sorted = Array.from({ length }, (_, index) => 40 + index * 37);
  return {
    random: () => Array.from({ length }, () => randomInt(0, 999)),
    sorted: () => [...sorted],
    reversed: () => [...sorted].reverse(),
    nearly: () => shuffleSome(sorted, 2),
    duplicates: () => Array.from({ length }, () => 250),
  };
}

function parseList(raw: string, { integer, min, max, maxLength }: SortConstraints) {
  if (!raw.trim()) return [];
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  const numbers: number[] = [];
  parts.forEach((part) => {
    if (numbers.length >= maxLength) return;
    if (integer && !/^\d+$/.test(part)) return;
    if (!integer && !/^\d+(\.\d+)?$/.test(part)) return;
    let value = integer ? Number.parseInt(part, 10) : Number(part);
    if (!integer) value = Math.round(value * 100) / 100;
    if (value < min || value > max) return;
    numbers.push(value);
  });
  return numbers;
}

export const algorithms: SortAlgorithm[] = [
  {
    id: 'selection',
    name: 'Selection',
    family: 'Comparison',
    blurb: 'Find the next smallest value and lock it in place. The sorted side grows from the left.',
    example: [29, 10, 14, 37, 13, 8, 22, 18],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 18, placeholder: '29, 10, 14, 37, 13',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'No' },
    how: 'Selection sort keeps a sorted prefix on the left. The prefix starts empty. Each pass scans the unsorted suffix, finds its smallest value, and swaps that value into the next prefix slot. After the swap, that index never changes.',
    steps: [
      'Assume the first unsorted index holds the minimum.',
      'Compare it with every value to its right and remember the smaller one.',
      'Swap the minimum into the current index.',
      'Advance one slot and repeat. The finished prefix grows by one each pass.',
    ],
    simulatorNote: 'Bars show the array itself. Amber is the current minimum, teal is the value being compared, and coral is a swap. Green indexes are finished. At most n swaps happen, even though the scan is always quadratic.',
    sort: selectionSort,
  },
  {
    id: 'insertion',
    name: 'Insertion',
    family: 'Comparison',
    blurb: 'Slide each new value back into a sorted hand. Sorted input needs almost no moves.',
    example: [29, 10, 14, 37, 13, 8, 22, 18],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 18, placeholder: '29, 10, 14, 37, 13',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
    how: 'Insertion sort treats the left side as a sorted hand of cards. It picks up the next unsorted value and shifts larger cards one position right until the gap is the correct place. Already-sorted input only needs one pass of comparisons, which is why the best case is linear.',
    steps: [
      'Leave index 0 as a sorted list of one.',
      'Pick up the next value.',
      'Shift every larger sorted value one step right.',
      'Drop the picked-up value into the gap. Equal values are not moved, so the sort is stable.',
    ],
    simulatorNote: 'Try Almost sorted and Sorted. Those runs finish after far fewer shifts than Random or Reversed, which is the behavior the O(n) best case describes.',
    sort: insertionSort,
  },
  {
    id: 'bubble',
    name: 'Bubble',
    family: 'Comparison',
    blurb: 'Swap adjacent pairs until large values reach the end. A pass with no swaps means the list is sorted.',
    example: [29, 10, 14, 37, 13, 8, 22, 18],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 18, placeholder: '29, 10, 14, 37, 13',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
    how: 'Bubble sort repeatedly compares neighbors. If a pair is out of order, the values swap. Each full pass places the next-largest value at the end, so the sorted region grows from the right. If a pass swaps nothing, the rest is already sorted and the algorithm stops.',
    steps: [
      'Compare index 0 with 1, then 1 with 2, and so on.',
      'Swap a pair when the left value is greater.',
      'After a pass, lock the last unsorted index as finished.',
      'Stop early when a pass makes no swaps.',
    ],
    simulatorNote: 'Sorted input stops after a single quiet pass. That early exit is what turns the best case into O(n). The algorithm is included because it makes adjacent swaps easy to see, not because it is a good production sort.',
    sort: bubbleSort,
  },
  {
    id: 'merge',
    name: 'Merge',
    family: 'Comparison',
    blurb: 'Split until every piece has one value, then merge. Equal values keep their original order.',
    example: [38, 27, 43, 3, 9, 82, 10, 15],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 16, placeholder: '38, 27, 43, 3, 9, 82',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Yes' },
    how: 'Merge sort divides the array into halves, sorts each half, and merges them. A merge looks at the front of two sorted runs and always writes the smaller one. The cost is the same for sorted, random, and reversed input because every level still copies the whole array.',
    steps: [
      'Split the current range in half.',
      'Sort the left half, then the right half.',
      'Merge the two runs from left to right.',
      'When the front values are equal, take the left one so the original order survives.',
    ],
    simulatorNote: 'The highlighted band is the range being split or merged. The smaller front value slides into the next place, and the values it passes shift right to make room. A tie leaves the left value where it is, so equal values keep their original order. The two runs are also held in extra memory, which is the O(n) space.',
    sort: mergeSort,
  },
  {
    id: 'quick',
    name: 'Quick',
    family: 'Comparison',
    blurb: 'Partition around a pivot, then sort each side. The pivot lands in its final place.',
    example: [29, 10, 14, 37, 13, 25, 8, 22],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 16, placeholder: '29, 10, 14, 37, 13',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: 'No' },
    how: 'Quick sort chooses a pivot and rearranges the range so smaller values sit to its left and larger values sit to its right. The pivot is then finished. The same process runs on each side. This version uses the last value of the range as the pivot, which is easy to follow and unbalanced on sorted input.',
    steps: [
      'Pick the last value in the current range as the pivot.',
      'Scan the range. Swap each smaller value into the left group.',
      'Place the pivot between the two groups. That index is finished.',
      'Sort the left group, then the right group.',
    ],
    simulatorNote: 'Amber is the pivot. The other amber mark, while it appears, is the boundary of the smaller-value group. Run Sorted to see the worst case: every partition peels off only one value. Run Random to see the more balanced average case.',
    sort: quickSort,
  },
  {
    id: 'heap',
    name: 'Heap',
    family: 'Comparison',
    blurb: 'Build a max-heap, then peel off the root. The largest remaining value moves to the end.',
    example: [29, 10, 14, 37, 13, 8, 22, 18],
    constraints: {
      integer: true, min: 1, max: 99, length: 12, maxLength: 16, placeholder: '29, 10, 14, 37, 13',
    },
    presets: intPresets(12, 1, 99),
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: 'No' },
    how: 'The array is read as a binary tree stored in index order. Heap sort first repairs that tree into a max-heap, so every parent is at least as large as its children and the largest value is at index 0. It then swaps the root with the last unsorted index and repairs the smaller heap.',
    steps: [
      'Lay the array out as a tree. Parent i sits above children 2i+1 and 2i+2.',
      'Starting from the last parent, repair each subtree downward.',
      'Swap the root with the last unsorted index and mark that index finished.',
      'Sift the new root down until the heap property holds again.',
      'Repeat. The sorted region grows from the right.',
    ],
    simulatorNote: 'The run starts as a row of indexes, then that row folds into the heap. Each parent sits above the children at 2i+1 and 2i+2, and the small number inside a node is its array index. Purple is the parent being repaired, teal marks the children it is compared with, and a swap slides along that edge. Green values have left the tree and are finished.',
    sort: heapSort,
  },
  {
    id: 'counting',
    name: 'Counting',
    family: 'Distribution',
    blurb: 'Count small integers, then write them back in order. The work is tallies, not comparisons.',
    example: [4, 2, 2, 8, 3, 3, 1, 7, 0, 5],
    constraints: {
      integer: true, min: 0, max: 9, length: 12, maxLength: 16, placeholder: '4, 2, 2, 8, 3, 3, 1',
    },
    presets: countingPresets(12),
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(n + k)', stable: 'Yes' },
    how: 'When every value is a small integer, counting them is faster than comparing them. This version counts values 0 through 9, turns those counts into end positions, and writes each input value into an output array from right to left. k is the value range, which is 10 here, so the cost follows the length of the input plus that fixed table.',
    steps: [
      'Count how many times each value from 0 to 9 appears.',
      'Build prefix sums so each slot says how many values are less than or equal to it.',
      'Walk the input from the right and write each value into the output slot reserved for it.',
      'Decrement that slot so the next equal value lands just to the left.',
    ],
    simulatorNote: 'The table under the bars is the count of each digit. During the write phase the bars become the output array, with empty slots still waiting for a value. Placing values from right to left is what makes equal items keep their original order.',
    sort: countingSort,
  },
  {
    id: 'bucket',
    name: 'Bucket',
    family: 'Distribution',
    blurb: 'Scatter fractions into ranges, sort each range, then join them. Nearby values share a bucket.',
    example: [0.42, 0.32, 0.33, 0.52, 0.37, 0.47, 0.51, 0.18],
    constraints: {
      integer: false, min: 0, max: 0.99, length: 10, maxLength: 14, placeholder: '0.42, 0.32, 0.33, 0.52',
    },
    presets: bucketPresets(10),
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)', stable: 'Yes' },
    how: 'Bucket sort spreads numbers across ordered buckets. This simulator uses values in [0, 1) and ten buckets, so 0.18 lands in bucket 1 and 0.73 lands in bucket 7. Each bucket is insertion-sorted, then the buckets are concatenated. If every value falls into one bucket, the work collapses into insertion sort and the worst case is quadratic.',
    steps: [
      'Multiply a value by the bucket count and take the floor. That is its bucket.',
      'Append it to that bucket, behind values that arrived earlier.',
      'Insertion-sort each bucket. The comparison uses greater-than, so ties stay in order.',
      'Write the buckets back from bucket 0 through bucket 9.',
    ],
    simulatorNote: 'The row under the bars is the ten buckets. Try Duplicates to see every value pile into one bucket, then watch insertion sort do all of the work inside it.',
    sort: bucketSort,
  },
  {
    id: 'radix',
    name: 'Radix',
    family: 'Distribution',
    blurb: 'Sort by one digit at a time, from ones to the highest place. Each pass keeps the order from the one before.',
    example: [329, 457, 657, 839, 436, 720, 355, 91],
    constraints: {
      integer: true, min: 0, max: 999, length: 10, maxLength: 14, placeholder: '329, 457, 657, 839, 436',
    },
    presets: radixPresets(10),
    complexity: { best: 'O(d · (n + b))', average: 'O(d · (n + b))', worst: 'O(d · (n + b))', space: 'O(n + b)', stable: 'Yes' },
    how: 'Radix sort never compares two whole numbers. It sorts by the ones digit, then the tens digit, then the hundreds digit, using a stable bucket for each digit 0–9. d is the number of digits and b is the base, 10. Because a later pass keeps the relative order from the earlier pass, the least significant digit is sorted first.',
    steps: [
      'Look at the current digit of every value, starting with the ones place.',
      'Append the value to the bucket for that digit.',
      'Collect the buckets from 0 through 9 back into the array.',
      'Move to the next digit. Stop after the longest number has been processed.',
    ],
    simulatorNote: '91 is treated as 091, so its hundreds digit is 0. Watch a short number stay in the correct place while a later pass only rearranges values by a higher digit. The pass label above the buckets names the digit currently in play.',
    sort: radixSort,
  },
];

export function getAlgorithm(id: string) {
  return algorithms.find((algorithm) => algorithm.id === id) ?? null;
}

export function parseAlgorithmInput(raw: string, algorithm: SortAlgorithm) {
  return parseList(raw, algorithm.constraints);
}

export const PRESET_NAMES: Array<{ id: PresetId; label: string }> = [
  { id: 'random', label: dictionary.sorting.presets.random },
  { id: 'nearly', label: dictionary.sorting.presets.nearly },
  { id: 'sorted', label: dictionary.sorting.presets.sorted },
  { id: 'reversed', label: dictionary.sorting.presets.reversed },
  { id: 'duplicates', label: dictionary.sorting.presets.duplicates },
];
