import type { EdgeGeometry, GraphEdge, LaidOutNode, PathNode, Point } from './types';

export const NODES: LaidOutNode[] = [
  { id: 'A', x: 90, y: 200 },
  { id: 'B', x: 250, y: 78 },
  { id: 'C', x: 250, y: 320 },
  { id: 'D', x: 460, y: 130 },
  { id: 'E', x: 460, y: 320 },
  { id: 'F', x: 640, y: 200 },
];

export const BASE_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'B', to: 'C', weight: 1 },
  { from: 'B', to: 'D', weight: 3 },
  { from: 'B', to: 'F', weight: 12, bend: -168 },
  { from: 'C', to: 'E', weight: 5 },
  { from: 'C', to: 'D', weight: 7 },
  { from: 'D', to: 'E', weight: 2 },
  { from: 'D', to: 'F', weight: 4 },
  { from: 'E', to: 'F', weight: 1 },
];

export function mapEdges(preset: string) {
  return BASE_EDGES.map((edge) => {
    if (preset === 'negative' && edge.from === 'D' && edge.to === 'E') {
      return { ...edge, weight: -2 };
    }
    return { ...edge };
  });
}

export function edgeKey(from: string, to: string) {
  return `${from}>${to}`;
}

export function outgoing(edges: GraphEdge[], id: string) {
  return edges.filter((edge) => edge.from === id);
}

export function blankDistances(nodes: PathNode[]) {
  return Object.fromEntries(nodes.map((node) => [node.id, null]));
}

export function distText(value: number | null) {
  return value == null ? '∞' : String(value);
}

export function reconstruct(parent: Record<string, string | undefined>, start: string, goal: string) {
  if (start === goal) return [start];
  if (parent[goal] == null) return [];
  const path = [goal];
  const seen = new Set([goal]);
  let cursor = goal;
  while (cursor !== start) {
    const next = parent[cursor];
    if (next == null || seen.has(next)) return [];
    cursor = next;
    seen.add(cursor);
    path.push(cursor);
  }
  return path.reverse();
}

export function pathEdges(path: string[]) {
  const roles: Record<string, 'path'> = {};
  for (let index = 0; index < path.length - 1; index += 1) {
    roles[edgeKey(path[index], path[index + 1])] = 'path';
  }
  return roles;
}

export const NODE_COUNT_MIN = 4;
export const NODE_COUNT_MAX = 8;

const LETTERS = 'ABCDEFGH';

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function layoutNodes(count: number): LaidOutNode[] {
  const cx = 360;
  const cy = 200;
  const rx = 270;
  const ry = 128;
  return Array.from({ length: count }, (_, index) => {
    const theta = Math.PI + (index * 2 * Math.PI) / count;
    return {
      id: LETTERS[index],
      x: Math.round(cx + rx * Math.cos(theta)),
      y: Math.round(cy + ry * Math.sin(theta)),
    };
  });
}

function connectNodes(nodes: LaidOutNode[]): GraphEdge[] {
  const ids = nodes.map((node) => node.id);
  const edges = ids.map((from, index) => ({
    from,
    to: ids[(index + 1) % ids.length],
    weight: randomInt(1, 9),
  }));
  const used = new Set(edges.map((edge) => edgeKey(edge.from, edge.to)));
  const extraCap = ids.length <= 4 ? 1 : ids.length <= 6 ? 2 : 3;
  let added = 0;
  let guard = 0;
  while (added < extraCap && guard < 40) {
    guard += 1;
    const fromIndex = randomInt(0, ids.length - 1);
    const skip = randomInt(2, Math.min(3, ids.length - 2));
    const to = ids[(fromIndex + skip) % ids.length];
    const from = ids[fromIndex];
    const key = edgeKey(from, to);
    if (used.has(key)) continue;
    edges.push({ from, to, weight: randomInt(1, 9) });
    used.add(key);
    added += 1;
  }
  return edges;
}

function hasNegativeCycle(nodes: PathNode[], edges: GraphEdge[]) {
  const distances = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  for (let round = 0; round < nodes.length; round += 1) {
    let changed = false;
    edges.forEach((edge) => {
      const offer = distances[edge.from] + edge.weight;
      if (offer < distances[edge.to]) {
        distances[edge.to] = offer;
        changed = true;
      }
    });
    if (!changed) return false;
  }
  return true;
}

function canReach(edges: GraphEdge[], start: string, target: string) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === target) return true;
    edges.forEach((edge) => {
      if (edge.from === id && !seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
    });
  }
  return false;
}

function applySafeNegative(nodes: PathNode[], edges: GraphEdge[]) {
  const order = shuffle(edges);
  for (let index = 0; index < order.length; index += 1) {
    const edge = order[index];
    const saved = edge.weight;
    const attempts = [-1, -2, -3];
    for (let attempt = 0; attempt < attempts.length; attempt += 1) {
      edge.weight = attempts[attempt];
      if (!hasNegativeCycle(nodes, edges)) return;
    }
    edge.weight = saved;
  }

  const ids = nodes.map((node) => node.id);
  const used = new Set(edges.map((edge) => edgeKey(edge.from, edge.to)));
  const candidates: Array<{ from: string; to: string }> = [];
  ids.forEach((from) => {
    ids.forEach((to) => {
      if (from === to || used.has(edgeKey(from, to))) return;
      if (canReach(edges, to, from)) return;
      candidates.push({ from, to });
    });
  });
  if (candidates.length === 0) return;
  const pick = candidates[randomInt(0, candidates.length - 1)];
  edges.push({ ...pick, weight: -randomInt(1, 3) });
}

const NODE_RADIUS = 26;
const BEND_OPTIONS = [0, 64, -64, 108, -108, 150, -150];
const LABEL_OPTIONS = [0.5, 0.36, 0.64, 0.28, 0.72];

function quadPoint(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}

function controlFor(from: Point, to: Point, bend: number): Point {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: mx + (-dy / length) * bend, y: my + (dx / length) * bend };
}

export function edgeGeometry(from: Point, to: Point, bend = 0): EdgeGeometry {
  if (!bend) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const x1 = from.x + ux * NODE_RADIUS;
    const y1 = from.y + uy * NODE_RADIUS;
    const x2 = to.x - ux * (NODE_RADIUS + 8);
    const y2 = to.y - uy * (NODE_RADIUS + 8);
    return { curved: false, x1, y1, x2, y2 };
  }
  const control = controlFor(from, to, bend);
  let low = 0;
  let high = 1;
  for (let step = 0; step < 18; step += 1) {
    const mid = (low + high) / 2;
    const point = quadPoint(from, control, to, mid);
    if (Math.hypot(point.x - from.x, point.y - from.y) < NODE_RADIUS) low = mid;
    else high = mid;
  }
  const start = quadPoint(from, control, to, (low + high) / 2);
  low = 0;
  high = 1;
  for (let step = 0; step < 18; step += 1) {
    const mid = (low + high) / 2;
    const point = quadPoint(from, control, to, mid);
    if (Math.hypot(point.x - to.x, point.y - to.y) < NODE_RADIUS + 8) high = mid;
    else low = mid;
  }
  const end = quadPoint(from, control, to, (low + high) / 2);
  return {
    curved: true,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    cx: control.x,
    cy: control.y,
  };
}

function pointOnDrawn(geometry: EdgeGeometry, t: number): Point {
  const clamped = Math.min(1, Math.max(0, t));
  if (!geometry.curved) {
    return {
      x: geometry.x1 + (geometry.x2 - geometry.x1) * clamped,
      y: geometry.y1 + (geometry.y2 - geometry.y1) * clamped,
    };
  }
  return quadPoint(
    { x: geometry.x1, y: geometry.y1 },
    { x: geometry.cx ?? 0, y: geometry.cy ?? 0 },
    { x: geometry.x2, y: geometry.y2 },
    clamped,
  );
}

export function labelPoint(from: Point, to: Point, bend = 0, labelAt = 0.5) {
  return pointOnDrawn(edgeGeometry(from, to, bend), labelAt);
}

function edgeSamples(geometry: EdgeGeometry) {
  return Array.from({ length: 9 }, (_, index) => pointOnDrawn(geometry, index / 8));
}

type Placement = {
  slack: number;
  bend: number;
  labelAt: number;
  geometry: EdgeGeometry;
  label: Point;
  samples: Point[];
};

function placementSlack(nodes: LaidOutNode[], placed: Placement[], from: LaidOutNode, to: LaidOutNode, bend: number, labelAt: number) {
  const geometry = edgeGeometry(from, to, bend);
  const label = pointOnDrawn(geometry, labelAt);
  const samples = edgeSamples(geometry);
  let slack = Infinity;
  nodes.forEach((node) => {
    slack = Math.min(slack, Math.hypot(label.x - node.x, label.y - node.y) - 46);
    if (node.id === from.id || node.id === to.id) return;
    samples.forEach((point) => {
      slack = Math.min(slack, Math.hypot(point.x - node.x, point.y - node.y) - 36);
    });
  });
  placed.forEach((other) => {
    slack = Math.min(slack, Math.hypot(label.x - other.label.x, label.y - other.label.y) - 40);
    other.samples.forEach((point) => {
      slack = Math.min(slack, Math.hypot(label.x - point.x, label.y - point.y) - 20);
    });
    samples.forEach((point) => {
      slack = Math.min(slack, Math.hypot(point.x - other.label.x, point.y - other.label.y) - 20);
    });
  });
  return { slack, geometry, label, samples };
}

function bestPlacement(nodes: LaidOutNode[], placed: Placement[], from: LaidOutNode, to: LaidOutNode): Placement {
  let choice: Placement | null = null;
  BEND_OPTIONS.forEach((bend) => {
    LABEL_OPTIONS.forEach((labelAt) => {
      const measured = placementSlack(nodes, placed, from, to, bend, labelAt);
      const candidate = { bend, labelAt, ...measured };
      if (!choice) {
        choice = candidate;
        return;
      }
      const candidateFits = candidate.slack >= 0;
      const choiceFits = choice.slack >= 0;
      if (candidateFits && !choiceFits) choice = candidate;
      else if (candidateFits && choiceFits && Math.abs(bend) < Math.abs(choice.bend)) choice = candidate;
      else if (!candidateFits && !choiceFits && candidate.slack > choice.slack) choice = candidate;
    });
  });
  if (!choice) throw new Error('A graph edge has no placement.');
  return choice;
}

function layoutEdges(nodes: LaidOutNode[], edges: GraphEdge[]) {
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const placed: Placement[] = [];
  const kept: GraphEdge[] = [];
  edges.forEach((edge, index) => {
    const from = byId[edge.from];
    const to = byId[edge.to];
    if (!from || !to) return;
    const choice = bestPlacement(nodes, placed, from, to);
    const required = index < nodes.length || edge.weight < 0;
    if (!required && choice.slack < 0) return;
    const next: GraphEdge = { from: edge.from, to: edge.to, weight: edge.weight };
    if (choice.bend) next.bend = choice.bend;
    if (choice.labelAt !== 0.5) next.labelAt = choice.labelAt;
    kept.push(next);
    placed.push(choice);
  });
  return kept;
}

export function randomGraph({ count = 6, negative = false }: { count?: number; negative?: boolean } = {}) {
  const size = Math.min(NODE_COUNT_MAX, Math.max(NODE_COUNT_MIN, count));
  const nodes = layoutNodes(size);
  const edges = connectNodes(nodes);
  if (negative) applySafeNegative(nodes, edges);
  return { nodes, edges: layoutEdges(nodes, edges) };
}
