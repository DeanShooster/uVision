import type { PathFrame, PathSearch, PathStep } from './types';
import { outgoing, pathEdges, reconstruct } from './graph';
import { paintRoles, snapshot } from './frames';

export function depthFirst({ nodes, edges, start, goal }: PathSearch) {
  const parent: Record<string, string> = {};
  const visited = new Set<string>();
  const stack: string[] = [];
  const frames: PathFrame[] = [];
  let found = false;

  const push = (extra: PathStep) => {
    frames.push(snapshot({
      showDistances: false,
      queueLabel: 'Stack',
      queue: [...stack].reverse(),
      ...extra,
    }));
  };

  function visit(current: string) {
    visited.add(current);
    stack.push(current);
    push({
      caption: `Visit ${current}`,
      note: current === start
        ? `Start at ${start} and follow the first unused arrow. Depth-first search stays on that branch until it ends.`
        : `Arrive at ${current} from ${parent[current]}. Keep going deeper before any other branch.`,
      nodeRoles: paintRoles({
        nodes,
        start,
        goal,
        current,
        visited: [...visited].filter((id) => id !== current),
      }),
    });

    if (current === goal) {
      found = true;
      return;
    }

    const nextEdges = outgoing(edges, current);
    nextEdges.forEach((edge) => {
      if (found || visited.has(edge.to)) return;
      parent[edge.to] = current;
      push({
        caption: `${current} → ${edge.to}`,
        note: `Follow ${current} → ${edge.to}. The other neighbors of ${current} wait until this branch comes back.`,
        edgeRoles: { [`${current}>${edge.to}`]: 'consider' },
        nodeRoles: paintRoles({
          nodes,
          start,
          goal,
          current,
          visited: [...visited],
        }),
      });
      visit(edge.to);
    });

    stack.pop();
    if (!found) {
      push({
        caption: `Backtrack from ${current}`,
        note: current === start
          ? `Every branch from ${start} has been tried. ${goal} was not on any of them.`
          : `${current} has no unused arrow that leads somewhere new. Step back to ${parent[current]} and try its next arrow.`,
        nodeRoles: paintRoles({
          nodes,
          start,
          goal,
          current: parent[current] ?? current,
          visited: [...visited],
        }),
      });
    }
  }

  visit(start);
  const path = found ? reconstruct(parent, start, goal) : [];
  push({
    caption: found ? 'A path, not the shortest' : 'No path',
    note: found
      ? `Depth-first search stops at the first path it finishes: ${path.join(' → ')}. Another branch can be shorter in edges or in weight. This search does not check.`
      : `The search walked every arrow it could reach and never entered ${goal}.`,
    path,
    queue: [],
    edgeRoles: pathEdges(path),
    nodeRoles: paintRoles({
      nodes,
      start,
      goal,
      path,
      visited: [...visited].filter((id) => !path.includes(id)),
    }),
  });

  return frames;
}
