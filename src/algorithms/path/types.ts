export type LaidOutNode = {
  id: string;
  x: number;
  y: number;
};

export type PathNode = {
  id: string;
  x?: number;
  y?: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  weight: number;
  bend?: number;
  labelAt?: number;
};

export type NodeRole = 'idle' | 'visited' | 'frontier' | 'current' | 'start' | 'goal' | 'path';

export type EdgeRole = 'idle' | 'consider' | 'relax' | 'path';

export type MatrixFocus = {
  k: number;
  i: number | null;
  j: number | null;
};

export type DistanceMatrix = {
  labels: string[];
  grid: Array<Array<number | null>>;
  focus: MatrixFocus | null;
};

export type PathFrame = {
  nodeRoles: Record<string, NodeRole>;
  edgeRoles: Record<string, EdgeRole>;
  distances: Record<string, number | null>;
  queue: string[];
  queueLabel: string;
  note: string;
  caption: string;
  path: string[];
  showDistances: boolean;
  matrix: DistanceMatrix | null;
};

import type { Explainable } from '../types';

export type PathSearch = {
  nodes: PathNode[];
  edges: GraphEdge[];
  start: string;
  goal: string;
};

export type PathAlgorithm = Explainable & {
  id: string;
  heading: string;
  blurb: string;
  start: string;
  goal: string;
  idleNote: string;
  allowsNegative?: boolean;
  run: (input: PathSearch) => PathFrame[];
};

export type PathStep = Partial<PathFrame> & {
  current?: string;
  focus?: MatrixFocus | null;
};

export type Point = {
  x: number;
  y: number;
};

export type EdgeGeometry = {
  curved: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx?: number;
  cy?: number;
};
