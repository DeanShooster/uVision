import type { Explainable } from '../types';

export type ComputeAlgorithm = Explainable & {
  id: string;
  heading: string;
  blurb: string;
  idleNote: string;
  legend: ReadonlyArray<readonly [string, string]>;
};

const COST_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['time', 'Time'],
  ['space', 'Space'],
  ['input', 'Input'],
  ['result', 'Result'],
];

export const computeAlgorithms: ComputeAlgorithm[] = [
  {
    id: 'euclidean',
    name: 'Euclidean',
    heading: 'Euclidean Algorithm',
    blurb: 'Finds the greatest common divisor by replacing the larger number with the remainder.',
    worksTitle: 'How the Euclidean algorithm works',
    readingTitle: 'Reading the bars',
    costRows: COST_ROWS,
    idleNote: 'Press Run to divide the larger number by the smaller one and replace the pair with the divisor and the remainder.',
    complexity: {
      time: 'O(log min(a, b))',
      space: 'O(1)',
      input: 'Two integers',
      result: 'Greatest divisor',
    },
    how: 'The Euclidean algorithm finds the largest integer that divides both numbers. It divides the larger by the smaller and keeps the remainder, because any common divisor of the pair also divides that remainder. The pair shrinks until the remainder is 0. The last non-zero remainder is the greatest common divisor.',
    steps: [
      'Put the larger number in a and the smaller number in b.',
      'Divide a by b and record the quotient and the remainder.',
      'Replace a with b, and b with the remainder.',
      'Stop when the remainder is 0. a is the greatest common divisor.',
    ],
    simulatorNote: 'The bars are the current pair, drawn against the size of the original numbers. During a division the coral top of a is the remainder. When the pair is replaced, b slides into a and the remainder slides into b. The equation under them is the division just performed. Green means the remainder is 0 and the divisor is known.',
    legend: [
      ['current', 'Current a'],
      ['frontier', 'Current b'],
      ['relax', 'Remainder'],
      ['path', 'Divisor found'],
    ],
  },
  {
    id: 'fft',
    name: 'FFT',
    heading: 'Fast Fourier Transform',
    blurb: 'Builds the frequencies by combining two values at a time and reusing each result.',
    worksTitle: 'How the fast Fourier transform works',
    readingTitle: 'Reading the diagram',
    costRows: COST_ROWS,
    idleNote: 'Press Run. Each step combines two values: add a turned copy of the lower one, and subtract that same copy.',
    complexity: {
      time: 'O(n log n)',
      space: 'O(n)',
      input: '8 samples',
      result: 'Frequencies',
    },
    how: 'A Fourier transform measures how much of each frequency is in the samples. Comparing every sample with every frequency is slow. This version reorders the samples, then answers in three rounds of pairs: neighbors, then rows 2 apart, then rows 4 apart. A pair has one rule. Multiply the lower value by a turn, which is 1, −i, −1, or i for these eight samples. Add that product to the upper value, and subtract it to make the other result. The next round reuses both results, so the work grows like n log n instead of n².',
    steps: [
      'Reorder the samples so each pair lines up.',
      'Read an upper value and a lower value.',
      'Multiply the lower value by this pair’s turn.',
      'Write the sum on the upper row of the next column, and the difference on the lower row.',
    ],
    simulatorNote: 'The left numbers are the original sample positions. The right numbers are frequencies, 0 at the top. Teal is the pair being combined, and coral is the two results just written. A dash runs from each of those values along the lines of the current round while the results appear. On the last step the green column is the spectrum.',
    legend: [
      ['current', 'Pair being combined'],
      ['relax', 'Results just written'],
      ['path', 'Spectrum'],
    ],
  },
  {
    id: 'pagerank',
    name: 'PageRank',
    heading: 'PageRank',
    blurb: 'Passes rank along outgoing links until the scores stop changing.',
    worksTitle: 'How PageRank works',
    readingTitle: 'Reading the pages',
    costRows: COST_ROWS,
    idleNote: 'Press Run to pass rank along the arrows. The number in a page is its current score.',
    complexity: {
      time: 'O(k(V + E))',
      space: 'O(V)',
      input: 'Directed links',
      result: 'Rank scores',
    },
    how: 'PageRank gives every page a score and updates the scores in passes. With damping 0.85, a pass sends 85% of a page’s score along its outgoing links, split evenly, and adds the other 15% as a teleport shared by every page. A page ends up high when pages that are themselves high link to it. The pass repeats until the scores barely move. This graph has no dangling page: every page has at least one outgoing link.',
    steps: [
      'Give every page the same starting score, 1 divided by the number of pages.',
      'For one page, split 85% of its score across the arrows leaving it.',
      'Do that for every page, then add the teleport to each score.',
      'Repeat the pass until the scores settle. The largest score is the highest rank.',
    ],
    simulatorNote: 'Teal is the page currently sending rank. A dash runs along each coral arrow that carries its share. The scores and the circle sizes stay as they are until every page has sent. The row under the graph is the new score being written, and a cell turns coral when this send adds to it. Then each circle grows or shrinks to match that row, and the line under it is the teleport added to every page. Green marks the highest score once the passes settle. Choose how many pages, and type one starting value per page. Random replaces the page count, the values, and the links.',
    legend: [
      ['current', 'Sending page'],
      ['relax', 'Link carrying a share'],
      ['path', 'Highest rank'],
    ],
  },
];

export function getComputeAlgorithm(id: string) {
  return computeAlgorithms.find((algorithm) => algorithm.id === id) ?? null;
}
