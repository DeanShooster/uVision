export type SortRole = 'compare' | 'read' | 'min' | 'pivot' | 'swap' | 'write' | 'region' | 'sorted';

export type CountAux = {
  kind: 'count';
  label: string;
  cells: number[];
  active: number | null;
};

export type BucketAux = {
  kind: 'buckets';
  label: string;
  buckets: number[][];
  active: number | null;
};

export type SortAux = CountAux | BucketAux;

export type SortFrame = {
  values: Array<number | null>;
  roles: Partial<Record<number, SortRole>>;
  sorted: number[];
  note: string;
  caption: string;
  aux: SortAux | null;
  shape?: 'array' | 'heap';
};

export type SnapshotExtras = {
  roles?: Partial<Record<number, SortRole>>;
  sorted?: number[];
  note?: string;
  caption?: string;
  aux?: SortAux | null;
  shape?: 'array' | 'heap';
};

export type SortPresets = {
  random: () => number[];
  sorted: () => number[];
  reversed: () => number[];
  nearly: () => number[];
  duplicates: () => number[];
};

export type PresetId = keyof SortPresets;

export type SortConstraints = {
  integer: boolean;
  min: number;
  max: number;
  length: number;
  maxLength: number;
  placeholder: string;
};

export type Explainable = {
  name: string;
  how: string;
  steps: readonly string[];
  simulatorNote: string;
  complexity: Record<string, string>;
  costRows?: ReadonlyArray<readonly [string, string]>;
  worksTitle?: string;
  readingTitle?: string;
};

export type SortAlgorithm = Explainable & {
  id: string;
  family: string;
  blurb: string;
  example: number[];
  constraints: SortConstraints;
  presets: SortPresets;
  sort: (input: number[]) => SortFrame[];
};
