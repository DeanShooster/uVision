import type { PathFrame, PathSearch, PathStep } from './types';
import { distText, outgoing, pathEdges, reconstruct } from './graph';
import { paintRoles, snapshot } from './frames';

function closest(distances: Record<string, number | null>, settled: Set<string>) {
  let best: string | null = null;
  Object.entries(distances).forEach(([id, value]) => {
    if (settled.has(id) || value == null) return;
    const bestDistance = best == null ? null : distances[best];
    if (best == null || bestDistance == null || value < bestDistance || (value === bestDistance && id < best)) {
      best = id;
    }
  });
  return best;
}

export function dijkstra({ nodes, edges, start, goal }: PathSearch) {
  const distances: Record<string, number | null> = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const parent: Record<string, string> = {};
  const settled = new Set<string>();
  distances[start] = 0;
  const frames: PathFrame[] = [];

  const push = (extra: PathStep) => {
    const frontier = nodes
      .map((node) => node.id)
      .filter((id) => !settled.has(id) && distances[id] != null && id !== extra.current);
    frames.push(snapshot({
      showDistances: true,
      queueLabel: 'Frontier',
      distances,
      queue: frontier,
      ...extra,
    }));
  };

  push({
    caption: 'Dijkstra',
    note: `${start} begins at distance 0. Every other node is still ∞. The next pick is always the unsettled node with the smallest distance.`,
    nodeRoles: paintRoles({ nodes, start, goal, frontier: [start] }),
  });

  while (settled.size < nodes.length) {
    const current = closest(distances, settled);
    if (current == null) break;
    settled.add(current);
    push({
      current,
      caption: `Settle ${current}`,
      note: current === goal
        ? `${goal} is the closest unsettled node, at distance ${distText(distances[current])}. With no negative weights, settling it means this distance is final.`
        : `${current} is the closest unsettled node, at distance ${distText(distances[current])}. Settle it, then try every arrow that leaves it.`,
      nodeRoles: paintRoles({
        nodes,
        start,
        goal,
        current,
        visited: [...settled].filter((id) => id !== current),
      }),
    });

    if (current === goal) break;

    outgoing(edges, current).forEach((edge) => {
      if (settled.has(edge.to)) return;
      const currentDistance = distances[current];
      if (currentDistance == null) return;
      const offer = currentDistance + edge.weight;
      const previous = distances[edge.to];
      const improved = previous == null || offer < previous;
      if (improved) {
        distances[edge.to] = offer;
        parent[edge.to] = current;
      }
      push({
        current,
        caption: `${current} → ${edge.to} (${edge.weight})`,
        note: improved
          ? `${distText(distances[current])} + ${edge.weight} = ${offer}, which beats ${distText(previous)}. ${edge.to} now sits at distance ${offer}, through ${current}.`
          : `${distText(distances[current])} + ${edge.weight} = ${offer}, and ${edge.to} is already ${distText(previous)}. The arrow does not help.`,
        edgeRoles: { [`${current}>${edge.to}`]: improved ? 'relax' : 'consider' },
        nodeRoles: paintRoles({
          nodes,
          start,
          goal,
          current,
          visited: [...settled].filter((id) => id !== current),
        }),
      });
    });
  }

  const path = reconstruct(parent, start, goal);
  const found = path.length > 0 && distances[goal] != null;
  push({
    caption: found ? `Shortest cost ${distances[goal]}` : 'No path',
    note: found
      ? `The cheapest path is ${path.join(' → ')} with total weight ${distances[goal]}. Dijkstra can do this only when every weight is zero or positive.`
      : `${goal} stayed at ∞. No path of arrows runs from ${start} to ${goal}.`,
    path: found ? path : [],
    queue: [],
    edgeRoles: found ? pathEdges(path) : {},
    nodeRoles: paintRoles({
      nodes,
      start,
      goal,
      path: found ? path : [],
      visited: [...settled].filter((id) => !path.includes(id)),
    }),
  });

  return frames;
}
