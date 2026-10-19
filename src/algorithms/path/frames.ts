import type { DistanceMatrix, NodeRole, PathFrame, PathNode, PathStep } from './types';

export function snapshot(state: PathStep): PathFrame {
  return {
    nodeRoles: { ...(state.nodeRoles ?? {}) },
    edgeRoles: { ...(state.edgeRoles ?? {}) },
    distances: { ...(state.distances ?? {}) },
    queue: [...(state.queue ?? [])],
    queueLabel: state.queueLabel ?? '',
    note: state.note ?? '',
    caption: state.caption ?? '',
    path: [...(state.path ?? [])],
    showDistances: Boolean(state.showDistances),
    matrix: state.matrix
      ? {
        labels: [...state.matrix.labels],
        grid: state.matrix.grid.map((row) => [...row]),
        focus: state.matrix.focus ? { ...state.matrix.focus } : null,
      }
      : null,
  };
}

export function paintRoles({
  nodes, start, goal, current, frontier = [], visited = [], path = [],
}: {
  nodes: PathNode[];
  start?: string;
  goal?: string;
  current?: string;
  frontier?: string[];
  visited?: string[];
  path?: string[];
}): Record<string, NodeRole> {
  const roles: Record<string, NodeRole> = {};
  nodes.forEach((node) => {
    roles[node.id] = 'idle';
  });
  visited.forEach((id) => {
    roles[id] = 'visited';
  });
  frontier.forEach((id) => {
    roles[id] = 'frontier';
  });
  path.forEach((id) => {
    roles[id] = 'path';
  });
  if (start) roles[start] = 'start';
  if (goal && goal !== start) roles[goal] = path.includes(goal) ? 'path' : 'goal';
  if (current) roles[current] = 'current';
  return roles;
}

export type { DistanceMatrix };
