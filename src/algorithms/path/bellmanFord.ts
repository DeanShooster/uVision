import type { GraphEdge, PathFrame, PathSearch, PathStep } from './types';
import { distText, edgeKey, pathEdges, reconstruct } from './graph';
import { paintRoles, snapshot } from './frames';

const RELAX_ORDER = ['E>F', 'D>E', 'A>B', 'A>C', 'B>C', 'B>D', 'B>F', 'C>E', 'C>D', 'D>F'];

function orderedEdges(edges: GraphEdge[]) {
  const rank = new Map(RELAX_ORDER.map((key, index) => [key, index]));
  return [...edges].sort((left, right) => {
    const leftRank = rank.get(edgeKey(left.from, left.to)) ?? 100;
    const rightRank = rank.get(edgeKey(right.from, right.to)) ?? 100;
    return leftRank - rightRank;
  });
}

export function bellmanFord({ nodes, edges, start, goal }: PathSearch) {
  const distances: Record<string, number | null> = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const parent: Record<string, string> = {};
  distances[start] = 0;
  const sequence = orderedEdges(edges);
  const frames: PathFrame[] = [];
  let negativeCycle = false;

  const push = (extra: PathStep) => {
    frames.push(snapshot({
      showDistances: true,
      queueLabel: 'Round',
      distances,
      ...extra,
    }));
  };

  push({
    caption: 'Bellman-Ford',
    note: `${start} starts at 0 and every other distance is ∞. Each round offers every arrow one chance to improve a distance. There are ${nodes.length - 1} rounds, one less than the number of nodes.`,
    nodeRoles: paintRoles({ nodes, start, goal }),
    queue: [],
    queueLabel: '',
  });

  for (let round = 1; round <= nodes.length - 1; round += 1) {
    let improved = false;
    push({
      caption: `Round ${round}`,
      note: `Round ${round} walks the arrows again. A distance found late in the last round can unlock a better one now.`,
      nodeRoles: paintRoles({ nodes, start, goal }),
      queue: [String(round)],
    });

    sequence.forEach((edge) => {
      const sourceDistance = distances[edge.from];
      if (sourceDistance == null) return;
      const offer = sourceDistance + edge.weight;
      const previous = distances[edge.to];
      if (previous != null && offer >= previous) return;
      distances[edge.to] = offer;
      parent[edge.to] = edge.from;
      improved = true;
      const sign = edge.weight < 0 ? ' The weight is negative, so the offer can undercut a path that already looked finished.' : '';
      push({
        caption: `${edge.from} → ${edge.to} (${edge.weight})`,
        note: `${distText(sourceDistance)} + ${edge.weight} = ${offer}, which beats ${distText(previous)}. ${edge.to} moves to ${offer}.${sign}`,
        edgeRoles: { [edgeKey(edge.from, edge.to)]: 'relax' },
        nodeRoles: paintRoles({
          nodes,
          start,
          goal,
          current: edge.to,
          visited: [edge.from],
        }),
        queue: [String(round)],
      });
    });

    if (!improved) {
      push({
        caption: `Round ${round} changes nothing`,
        note: `No arrow improved a distance in round ${round}. Further rounds would repeat this, so the distances are final.`,
        nodeRoles: paintRoles({ nodes, start, goal }),
        queue: [String(round)],
      });
      break;
    }
  }

  sequence.forEach((edge) => {
    const fromDistance = distances[edge.from];
    if (negativeCycle || fromDistance == null) return;
    const offer = fromDistance + edge.weight;
    const targetDistance = distances[edge.to];
    if (targetDistance == null || offer < targetDistance) negativeCycle = true;
  });

  const path = negativeCycle ? [] : reconstruct(parent, start, goal);
  const found = !negativeCycle && path.length > 0 && distances[goal] != null;
  push({
    caption: negativeCycle ? 'Negative cycle' : found ? `Shortest cost ${distances[goal]}` : 'No path',
    note: negativeCycle
      ? 'One more pass could still lower a distance. A reachable negative cycle means there is no cheapest path.'
      : found
        ? `The cheapest path is ${path.join(' → ')} with total weight ${distances[goal]}. Bellman-Ford allows a negative weight, as long as no reachable cycle has a negative total.`
        : `${goal} stayed at ∞. No path of arrows runs from ${start} to ${goal}.`,
    path: found ? path : [],
    queue: [],
    queueLabel: '',
    edgeRoles: found ? pathEdges(path) : {},
    nodeRoles: paintRoles({
      nodes,
      start,
      goal,
      path: found ? path : [],
    }),
  });

  return frames;
}
