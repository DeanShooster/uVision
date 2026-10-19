import { describe, expect, it } from 'vitest';
import { bellmanFord } from './bellmanFord';
import { breadthFirst } from './bfs';
import { pathAlgorithms } from './catalog';
import { depthFirst } from './dfs';
import { dijkstra } from './dijkstra';
import { floydWarshall } from './floydWarshall';
import { BASE_EDGES, labelPoint, mapEdges, NODES, randomGraph } from './graph';
import type { GraphEdge, PathFrame, PathNode } from './types';

const base = { nodes: NODES, edges: mapEdges('road'), start: 'A', goal: 'F' };

function last(frames: PathFrame[]) {
  return frames[frames.length - 1];
}

function independentDijkstra(edges: GraphEdge[], start: string, nodes: PathNode[] = NODES) {
  const ids = nodes.map((node) => node.id);
  const dist: Record<string, number | null> = Object.fromEntries(ids.map((id) => [id, null]));
  const parent: Record<string, string> = {};
  const used = new Set<string>();
  dist[start] = 0;
  while (used.size < ids.length) {
    let best: string | null = null;
    ids.forEach((id) => {
      const known = dist[id];
      if (used.has(id) || known == null) return;
      const bestDistance = best == null ? null : dist[best];
      if (best == null || bestDistance == null || known < bestDistance || (known === bestDistance && id < best)) best = id;
    });
    if (best == null) break;
    const settled = best;
    used.add(settled);
    edges.filter((edge) => edge.from === settled).forEach((edge) => {
      const settledDistance = dist[settled];
      if (settledDistance == null) return;
      const offer = settledDistance + edge.weight;
      const previous = dist[edge.to];
      if (previous == null || offer < previous) {
        dist[edge.to] = offer;
        parent[edge.to] = settled;
      }
    });
  }
  return { dist, parent };
}

describe('pathfinding frames', () => {
  pathAlgorithms.forEach((algorithm) => {
    it(`${algorithm.id} explains every frame`, () => {
      const frames = algorithm.run({ ...base, edges: mapEdges('road') });
      expect(frames.length).toBeGreaterThan(2);
      expect(frames.length).toBeLessThan(400);
      frames.forEach((frame) => {
        expect(frame.note.length).toBeGreaterThan(8);
      });
    });
  });

  it('breadth-first search finds the path with the fewest edges', () => {
    const frame = last(breadthFirst(base));
    expect(frame.path).toEqual(['A', 'B', 'F']);
    expect(frame.distances.F).toBe(2);
  });

  it('depth-first search finishes the first branch and reaches the goal', () => {
    const frame = last(depthFirst(base));
    expect(frame.path).toEqual(['A', 'B', 'C', 'E', 'F']);
    expect(frame.path).not.toEqual(['A', 'B', 'F']);
  });

  it("Dijkstra's distances match an independent search", () => {
    const expected = independentDijkstra(base.edges, 'A');
    const frame = last(dijkstra(base));
    expect(frame.distances).toEqual(expected.dist);
    expect(frame.path).toEqual(['A', 'C', 'E', 'F']);
    expect(frame.distances.F).toBe(8);
  });

  it('Bellman-Ford matches Dijkstra on the road map', () => {
    const expected = independentDijkstra(base.edges, 'A');
    const frame = last(bellmanFord(base));
    expect(frame.distances).toEqual(expected.dist);
    expect(frame.path).toEqual(['A', 'C', 'E', 'F']);
    expect(frame.note.toLowerCase()).not.toContain('negative cycle');
  });

  it('Bellman-Ford uses the negative edge on a later round', () => {
    const edges = mapEdges('negative');
    const expected = independentDijkstra(edges, 'A');
    const frame = last(bellmanFord({ ...base, edges }));
    expect(expected.dist.E).toBe(5);
    expect(expected.dist.F).toBe(6);
    expect(frame.distances).toEqual(expected.dist);
    expect(frame.path).toEqual(['A', 'B', 'D', 'E', 'F']);
    const improve = bellmanFord({ ...base, edges }).find((item) => item.caption === 'D → E (-2)');
    expect(improve?.note).toContain('negative');
  });

  it('Floyd-Warshall matches repeated shortest paths and highlights A to F', () => {
    const frame = last(floydWarshall(base));
    const ids = NODES.map((node) => node.id);
    ids.forEach((source) => {
      const expected = independentDijkstra(base.edges, source).dist;
      const row = ids.indexOf(source);
      ids.forEach((target, column) => {
        expect(frame.matrix?.grid[row][column]).toBe(expected[target]);
      });
    });
    expect(frame.path).toEqual(['A', 'C', 'E', 'F']);
  });

  it('Bellman-Ford reports a reachable negative cycle', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }];
    const edges = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'A', weight: -2 },
    ];
    const frame = last(bellmanFord({ nodes, edges, start: 'A', goal: 'B' }));
    expect(frame.note.toLowerCase()).toContain('negative cycle');
    expect(frame.path).toEqual([]);
  });

  it('the road map edges are the ones the page draws', () => {
    expect(BASE_EDGES).toHaveLength(10);
    expect(mapEdges('negative').find((edge) => edge.from === 'D' && edge.to === 'E')?.weight).toBe(-2);
  });

  it('a chosen node count deals a connected map with positive weights', () => {
    for (let sample = 0; sample < 20; sample += 1) {
      const count = 4 + (sample % 5);
      const { nodes, edges } = randomGraph({ count });
      const ids = nodes.map((node) => node.id);
      expect(nodes).toHaveLength(count);
      expect(new Set(ids).size).toBe(count);
      const keys = edges.map((edge) => `${edge.from}>${edge.to}`);
      expect(new Set(keys).size).toBe(keys.length);
      edges.forEach((edge) => {
        expect(edge.weight).toBeGreaterThanOrEqual(1);
        expect(edge.weight).toBeLessThanOrEqual(9);
      });
      ids.forEach((source) => {
        const reached = independentDijkstra(edges, source, nodes).dist;
        ids.forEach((target) => {
          expect(reached[target]).not.toBeNull();
        });
      });
      const goal = ids[count - 1];
      const expected = independentDijkstra(edges, ids[0], nodes).dist;
      const frame = last(dijkstra({ nodes, edges, start: ids[0], goal }));
      expect(frame.distances[goal]).toBe(expected[goal]);
      expect(frame.path[0]).toBe(ids[0]);
      expect(frame.path[frame.path.length - 1]).toBe(goal);
    }
  });

  it('weight labels stay off the nodes and off each other', () => {
    for (let sample = 0; sample < 40; sample += 1) {
      const count = 4 + (sample % 5);
      const { nodes, edges } = randomGraph({ count, negative: sample % 2 === 0 });
      const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
      const labels = edges.map((edge) => labelPoint(byId[edge.from], byId[edge.to], edge.bend, edge.labelAt ?? 0.5));
      labels.forEach((label, index) => {
        nodes.forEach((node) => {
          expect(Math.hypot(label.x - node.x, label.y - node.y)).toBeGreaterThan(40);
        });
        labels.slice(index + 1).forEach((other) => {
          expect(Math.hypot(label.x - other.x, label.y - other.y)).toBeGreaterThan(34);
        });
      });
    }
  });

  it('a negative map has one negative weight and still has a cheapest path', () => {
    for (let sample = 0; sample < 12; sample += 1) {
      const { nodes, edges } = randomGraph({ count: 6, negative: true });
      expect(edges.filter((edge) => edge.weight < 0)).toHaveLength(1);
      const frame = last(bellmanFord({ nodes, edges, start: 'A', goal: 'F' }));
      expect(frame.note.toLowerCase()).not.toContain('negative cycle');
      expect(frame.path[0]).toBe('A');
      expect(frame.path[frame.path.length - 1]).toBe('F');
    }
  });
});
