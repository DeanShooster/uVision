import type { PathFrame, PathSearch, PathStep } from './types';
import { distText, outgoing, pathEdges, reconstruct } from './graph';
import { paintRoles, snapshot } from './frames';

export function breadthFirst({ nodes, edges, start, goal }: PathSearch) {
  const distances: Record<string, number | null> = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const parent: Record<string, string> = {};
  const seen = new Set([start]);
  const queue = [start];
  distances[start] = 0;
  const frames: PathFrame[] = [];

  const push = (extra: PathStep) => {
    frames.push(snapshot({
      showDistances: true,
      queueLabel: 'Queue',
      distances,
      queue,
      ...extra,
    }));
  };

  push({
    caption: 'Breadth-first search',
    note: `${start} starts the queue at 0 edges. Every node that joins later is one edge farther out.`,
    nodeRoles: paintRoles({ nodes, start, goal, frontier: queue, visited: [] }),
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) break;
    const visited = [...seen].filter((id) => !queue.includes(id) && id !== current);
    push({
      caption: `Expand ${current}`,
      note: current === start
        ? `Take ${start} from the front of the queue. Its neighbors are the first layer.`
        : `Take ${current} from the front of the queue. It sits ${distText(distances[current])} edge${distances[current] === 1 ? '' : 's'} from ${start}.`,
      nodeRoles: paintRoles({
        nodes, start, goal, current, frontier: queue, visited,
      }),
    });

    if (current === goal) break;

    outgoing(edges, current).forEach((edge) => {
      if (seen.has(edge.to)) return;
      seen.add(edge.to);
      parent[edge.to] = current;
      distances[edge.to] = (distances[current] ?? 0) + 1;
      queue.push(edge.to);
      const goalHit = edge.to === goal;
      push({
        caption: `${current} → ${edge.to}`,
        note: goalHit
          ? `${edge.to} joins the queue from ${current}. This is the first time the goal is reached, so the path has the fewest edges.`
          : `${edge.to} has not been seen. It joins the back of the queue with distance ${distances[edge.to]}.`,
        edgeRoles: { [`${current}>${edge.to}`]: 'relax' },
        nodeRoles: paintRoles({
          nodes,
          start,
          goal,
          current,
          frontier: queue,
          visited: [...seen].filter((id) => !queue.includes(id) && id !== current),
        }),
      });
    });
  }

  const path = reconstruct(parent, start, goal);
  const found = path.length > 0;
  push({
    caption: found ? 'Fewest edges' : 'No path',
    note: found
      ? `The path ${path.join(' → ')} uses ${distances[goal]} edge${distances[goal] === 1 ? '' : 's'}. Breadth-first search ignores the weights, so this is the shortest path in hops, not in cost.`
      : `${goal} was never reached. No path runs from ${start} to ${goal} along these arrows.`,
    path,
    edgeRoles: pathEdges(path),
    nodeRoles: paintRoles({
      nodes,
      start,
      goal,
      path,
      visited: [...seen].filter((id) => !path.includes(id)),
    }),
    queue: [],
  });

  return frames;
}
