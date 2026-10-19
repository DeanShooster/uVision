import type { GraphEdge, MatrixFocus, PathFrame, PathNode, PathSearch, PathStep } from './types';
import { distText, pathEdges } from './graph';
import { paintRoles, snapshot } from './frames';

function directGrid(nodes: PathNode[], edges: GraphEdge[]) {
  const ids = nodes.map((node) => node.id);
  const index = new Map(ids.map((id, place) => [id, place]));
  const grid: Array<Array<number | null>> = ids.map(() => ids.map(() => null));
  const next: Array<Array<number | null>> = ids.map(() => ids.map(() => null));
  for (let place = 0; place < ids.length; place += 1) {
    grid[place][place] = 0;
    next[place][place] = place;
  }
  edges.forEach((edge) => {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from == null || to == null) return;
    const current = grid[from][to];
    if (current == null || edge.weight < current) {
      grid[from][to] = edge.weight;
      next[from][to] = to;
    }
  });
  return { ids, grid, next };
}

function routeThrough(ids: string[], next: Array<Array<number | null>>, start: string, goal: string) {
  const from = ids.indexOf(start);
  const to = ids.indexOf(goal);
  if (from < 0 || to < 0 || next[from][to] == null) return [];
  const path = [start];
  let cursor = from;
  for (let guard = 0; guard <= ids.length; guard += 1) {
    if (cursor === to) return path;
    const step = next[cursor][to];
    if (step == null) return [];
    cursor = step;
    path.push(ids[cursor]);
  }
  return [];
}

export function floydWarshall({ nodes, edges, start, goal }: PathSearch) {
  const { ids, grid, next } = directGrid(nodes, edges);
  const frames: PathFrame[] = [];

  const matrix = (focus: MatrixFocus | null) => ({ labels: ids, grid, focus });

  const push = (extra: PathStep) => {
    frames.push(snapshot({
      showDistances: false,
      queueLabel: 'Shortcut',
      ...extra,
      matrix: matrix(extra.focus ?? null),
    }));
  };

  push({
    caption: 'Direct arrows only',
    note: 'The table starts with the weight of each arrow. ∞ means that pair has no direct arrow. The diagonal is 0, the distance from a node to itself.',
    nodeRoles: paintRoles({ nodes, start, goal }),
    queue: [],
    focus: null,
  });

  ids.forEach((through, k) => {
    push({
      caption: `Shortcut ${through}`,
      note: `${through} may sit between any pair. For every pair i and j, compare the current distance with the route that goes i → ${through} → j.`,
      nodeRoles: paintRoles({ nodes, start, goal, current: through }),
      queue: [through],
      focus: { k, i: null, j: null },
    });

    ids.forEach((from, i) => {
      ids.forEach((to, j) => {
        if (grid[i][k] == null || grid[k][j] == null) return;
        const offer = grid[i][k] + grid[k][j];
        const previous = grid[i][j];
        if (previous != null && offer >= previous) return;
        grid[i][j] = offer;
        next[i][j] = next[i][k];
        push({
          caption: `${from} → ${to} via ${through}`,
          note: `${from} → ${through} → ${to} costs ${distText(offer - grid[k][j])} + ${distText(grid[k][j])} = ${offer}, better than ${distText(previous)}. The table writes ${offer}.`,
          nodeRoles: paintRoles({
            nodes,
            start,
            goal,
            current: through,
            frontier: [from, to].filter((id) => id !== through),
          }),
          queue: [through],
          focus: { k, i, j },
        });
      });
    });
  });

  const path = routeThrough(ids, next, start, goal);
  const total = grid[ids.indexOf(start)][ids.indexOf(goal)];
  push({
    caption: path.length > 1 ? `${start} to ${goal} costs ${total}` : 'All pairs',
    note: path.length > 1
      ? `Every pair now holds its cheapest distance. ${start} to ${goal} is ${path.join(' → ')} with total weight ${total}. The same table answers any other pair.`
      : `Every pair now holds its cheapest distance. ${start} cannot reach ${goal}, so that cell stays ∞.`,
    path,
    queue: [],
    edgeRoles: pathEdges(path),
    nodeRoles: paintRoles({ nodes, start, goal, path }),
    focus: null,
  });

  return frames;
}
