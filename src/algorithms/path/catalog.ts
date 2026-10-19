import type { PathAlgorithm } from './types';
import { bellmanFord } from './bellmanFord';
import { breadthFirst } from './bfs';
import { depthFirst } from './dfs';
import { dijkstra } from './dijkstra';
import { floydWarshall } from './floydWarshall';

const COST_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['time', 'Time'],
  ['space', 'Space'],
  ['weights', 'Weights'],
  ['result', 'Result'],
];

const READING = 'Reading the graph';

export const pathAlgorithms: PathAlgorithm[] = [
  {
    id: 'dijkstra',
    name: "Dijkstra's",
    heading: "Dijkstra's algorithm",
    blurb: 'Always expand the closest unsettled node, then update its neighbors.',
    worksTitle: "How Dijkstra's algorithm works",
    readingTitle: READING,
    costRows: COST_ROWS,
    start: 'A',
    goal: 'F',
    idleNote: 'Press Run to grow the shortest paths from the start. Each step settles the closest unsettled node.',
    complexity: {
      time: 'O((V + E) log V)',
      space: 'O(V)',
      weights: 'Non-negative',
      result: 'Shortest path',
    },
    how: "Dijkstra's algorithm keeps a distance for every node, starting at 0 for the source and infinity everywhere else. It repeatedly settles the unsettled node with the smallest distance and relaxes each arrow leaving that node. Once a node is settled, a later path cannot beat it, which is true only when every weight is zero or positive. A binary heap can hand back that closest node, which is the usual O((V + E) log V) bound. This view shows the choice itself.",
    steps: [
      'Give the start distance 0 and every other node distance ∞.',
      'Settle the unsettled node with the smallest distance.',
      'For each arrow leaving it, replace a neighbor’s distance when the route through this node is cheaper.',
      'Stop when the goal is settled. Its distance is the cheapest total weight.',
    ],
    simulatorNote: 'Gold is the start and violet is the goal. Teal is the node being settled. Coral marks an arrow that improves a distance. The distances the search has saved sit in the row under the graph. Green is the finished path. The frontier lists nodes that have a distance but are not settled yet.',
    run: dijkstra,
  },
  {
    id: 'bellman-ford',
    name: 'Bellman-Ford',
    heading: 'Bellman-Ford',
    blurb: 'Relax every arrow, round after round, until no distance improves.',
    worksTitle: 'How Bellman-Ford works',
    readingTitle: READING,
    costRows: COST_ROWS,
    start: 'A',
    goal: 'F',
    allowsNegative: true,
    idleNote: 'Press Run to relax every arrow in rounds. Choose how many nodes to deal a new map. Negative edge gives one arrow a negative weight.',
    complexity: {
      time: 'O(V · E)',
      space: 'O(V)',
      weights: 'Negative ok',
      result: 'Shortest path',
    },
    how: 'Bellman-Ford does not pick a closest node. It makes |V| − 1 passes over every arrow, and each pass replaces a distance when the arrow offers something cheaper. A shortest path has at most |V| − 1 arrows, so after that many passes every distance is final, unless a reachable cycle has a negative total. One extra pass checks for that cycle: if a distance can still fall, no cheapest path exists. A new map uses positive weights. Negative edge gives one arrow a negative weight, without a negative cycle, so a later round can undercut a distance.',
    steps: [
      'Give the start distance 0 and every other node distance ∞.',
      'In each round, try every arrow and keep a distance when the offer is smaller.',
      'Repeat for one round fewer than the number of nodes, or stop early when a round changes nothing.',
      'Try the arrows once more. A further improvement means a reachable negative cycle.',
    ],
    simulatorNote: 'The round counter is how many full passes have started. Coral is an arrow that just lowered a distance. The saved distances sit in the row under the graph. Green is the cheapest path. Negative edge gives one arrow a negative weight, so a later round can undercut a distance that an earlier round already wrote.',
    run: bellmanFord,
  },
  {
    id: 'floyd-warshall',
    name: 'Floyd-Warshall',
    heading: 'Floyd-Warshall',
    blurb: 'Let every node take a turn as a shortcut between all pairs.',
    worksTitle: 'How Floyd-Warshall works',
    readingTitle: READING,
    costRows: COST_ROWS,
    start: 'A',
    goal: 'F',
    allowsNegative: true,
    idleNote: 'Press Run to fill a distance for every pair. Choose how many nodes to deal a new map. The highlighted path is only the pair you picked.',
    complexity: {
      time: 'O(V³)',
      space: 'O(V²)',
      weights: 'Negative ok',
      result: 'All pairs',
    },
    how: 'Floyd-Warshall answers every pair, not one journey. It starts from the direct arrows, then lets each node k take a turn as a permitted shortcut. For every pair i and j it asks whether i → k → j is cheaper than the distance already stored. After every node has been the shortcut, each cell is the cheapest distance for that pair, as long as no negative cycle exists. The start and goal only choose which path to draw at the end. The table holds the rest.',
    steps: [
      'Write each direct weight into a table, ∞ where no arrow exists, and 0 on the diagonal.',
      'Pick the next node k as a shortcut.',
      'For every pair, replace the stored distance when going through k is cheaper.',
      'After every node has been k, read any pair from the table.',
    ],
    simulatorNote: 'The table is the algorithm. A coral cell was just improved by the shortcut named above it. Teal is that shortcut on the graph. At the end, green draws the path for the start and goal you picked. Negative edge gives one arrow a negative weight, so some cells fall by using that arrow.',
    run: floydWarshall,
  },
  {
    id: 'bfs',
    name: 'Breadth-first',
    heading: 'Breadth-first search',
    blurb: 'Expand one layer of arrows at a time until the goal appears.',
    worksTitle: 'How breadth-first search works',
    readingTitle: READING,
    costRows: COST_ROWS,
    start: 'A',
    goal: 'F',
    idleNote: 'Press Run to expand the search one layer at a time. Weights are ignored. The queue holds the next layer.',
    complexity: {
      time: 'O(V + E)',
      space: 'O(V)',
      weights: 'Ignored',
      result: 'Fewest edges',
    },
    how: 'Breadth-first search keeps a queue. The start goes in first. Each step takes the node at the front and puts its unseen neighbors at the back. Nodes therefore leave the queue in order of how many arrows they are from the start: the whole first layer, then the next layer. The first time the goal is reached, no path with fewer arrows exists. The weights on the arrows do not matter. A heavy two-arrow path beats a light three-arrow path.',
    steps: [
      'Put the start in the queue with distance 0.',
      'Take the node at the front of the queue.',
      'Add each unseen neighbor to the back, one edge farther than the node you just took.',
      'Stop when the goal leaves the queue. Count the edges, not the weights.',
    ],
    simulatorNote: 'The queue is drawn under the graph, front at the left. Teal is the node just taken from the front. Stone-colored nodes are still waiting in the queue. The row under the graph is how many edges each node is from the start. Green is the path with the fewest edges. Gold is the start and violet is the goal.',
    run: breadthFirst,
  },
  {
    id: 'dfs',
    name: 'Depth-first',
    heading: 'Depth-first search',
    blurb: 'Follow one branch to the end, then backtrack and try the next.',
    worksTitle: 'How depth-first search works',
    readingTitle: READING,
    costRows: COST_ROWS,
    start: 'A',
    goal: 'F',
    idleNote: 'Press Run to follow one branch as far as it goes. The stack is the way back.',
    complexity: {
      time: 'O(V + E)',
      space: 'O(V)',
      weights: 'Ignored',
      result: 'One path',
    },
    how: 'Depth-first search follows the first unused arrow and keeps going until that branch cannot continue. It then steps back to the previous node and tries the next arrow. A stack remembers the way back. The search stops at the first time it enters the goal, so the path depends on the order of the arrows. It is not the cheapest path and it is not even the path with the fewest edges. It is the path this order happened to finish first.',
    steps: [
      'Start at the source and mark it visited.',
      'Follow the first arrow to a node that has not been visited.',
      'When a node has no new arrow, pop back and try the next arrow there.',
      'Stop at the first visit to the goal and read the stack as the path.',
    ],
    simulatorNote: 'Teal is the node just entered. The stack under the graph reads from the top at the left, which is the way back. Coral is the arrow about to be followed. Green is the first path the search finished. It can be longer, in edges or in weight, than the path another search would choose.',
    run: depthFirst,
  },
];

export function getPathAlgorithm(id: string) {
  return pathAlgorithms.find((algorithm) => algorithm.id === id) ?? null;
}
