import { formatNumber } from './format';
import type { PageRankFrame, RankEdge, RankGraph, RankPage } from './types';

export const DAMPING = 0.85;
export const RANK_NODE_MIN = 3;
export const RANK_NODE_MAX = 8;

export const RANK_PAGES: RankPage[] = [
  { id: 'A', x: 150, y: 200 },
  { id: 'B', x: 360, y: 78 },
  { id: 'C', x: 570, y: 200 },
  { id: 'D', x: 360, y: 322 },
];

export const RANK_EDGES: RankEdge[] = [
  { from: 0, to: 1, bend: 0 },
  { from: 0, to: 2, bend: -42 },
  { from: 2, to: 0, bend: 42 },
  { from: 1, to: 2, bend: 0 },
  { from: 3, to: 0, bend: 28 },
  { from: 3, to: 1, bend: 56 },
  { from: 3, to: 2, bend: -28 },
];

export const TEXTBOOK_GRAPH: RankGraph = { pages: RANK_PAGES, edges: RANK_EDGES };

function clampCount(count: number) {
  return Math.min(RANK_NODE_MAX, Math.max(RANK_NODE_MIN, Math.trunc(count)));
}

function placePages(count: number): RankPage[] {
  const cx = 360;
  const cy = 200;
  const rx = count <= 4 ? 210 : 250;
  const ry = count <= 4 ? 120 : 140;
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return {
      id: String.fromCharCode(65 + index),
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
    };
  });
}

function bendReciprocal(edges: RankEdge[]): RankEdge[] {
  const forward = new Set(edges.map((edge) => `${edge.from}:${edge.to}`));
  return edges.map((edge) => {
    if (!forward.has(`${edge.to}:${edge.from}`)) return { ...edge, bend: 0 };
    return { ...edge, bend: edge.from < edge.to ? 34 : -34 };
  });
}

export function ringGraph(count: number): RankGraph {
  const size = clampCount(count);
  const edges: RankEdge[] = [];
  for (let index = 0; index < size; index += 1) {
    edges.push({ from: index, to: (index + 1) % size, bend: 0 });
    if (size >= 4) edges.push({ from: index, to: (index + 2) % size, bend: 0 });
  }
  return { pages: placePages(size), edges: bendReciprocal(edges) };
}

export function randomRankGraph(count: number): RankGraph {
  const size = clampCount(count);
  const edges: RankEdge[] = [];
  const has = (from: number, to: number) => edges.some((edge) => edge.from === from && edge.to === to);
  for (let index = 0; index < size; index += 1) {
    edges.push({ from: index, to: (index + 1) % size, bend: 0 });
  }
  for (let index = 0; index < size; index += 1) {
    if (Math.random() > 0.7) continue;
    const choices: number[] = [];
    for (let offset = 2; offset < size; offset += 1) {
      const to = (index + offset) % size;
      if (!has(index, to)) choices.push(to);
    }
    if (choices.length === 0) continue;
    const to = choices[Math.floor(Math.random() * choices.length)] ?? index;
    edges.push({ from: index, to, bend: 0 });
  }
  return { pages: placePages(size), edges: bendReciprocal(edges) };
}

export function parseRankValues(raw: string, count: number): number[] | null {
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length !== count || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) return null;
  const values = parts.map(Number);
  if (values.some((value) => value > 20) || values.every((value) => value === 0)) return null;
  return values;
}

function openingScores(count: number, startValues?: number[]) {
  if (!startValues || startValues.length !== count || startValues.every((value) => value <= 0)) {
    return Array.from({ length: count }, () => 1 / count);
  }
  const total = startValues.reduce((sum, value) => sum + value, 0);
  return startValues.map((value) => value / total);
}

export function pageRank(graph: RankGraph = TEXTBOOK_GRAPH, startValues?: number[]) {
  const { pages, edges } = graph;
  const count = pages.length;
  const teleport = (1 - DAMPING) / count;
  let scores = openingScores(count, startValues);
  const uniform = scores.every((score) => Math.abs(score - (scores[0] ?? 0)) < 1e-9);
  const summary = () => pages.map((page, index) => `${page.id} ${formatNumber(scores[index] ?? 0)}`).join(', ');
  const frames: PageRankFrame[] = [{
    kind: 'pagerank',
    caption: uniform ? 'Equal start' : 'Scaled start',
    note: uniform
      ? `Each page starts at ${formatNumber(1 / count)}. A pass sends 85% of a page's rank along its links, split evenly, and every page also receives a teleport of ${teleport.toFixed(4)}.`
      : `The typed values were scaled so they add up to 1. The pages start at ${summary()}. A pass sends 85% of a page's rank along its links, and every page also receives a teleport of ${teleport.toFixed(4)}.`,
    pages,
    edges,
    scores: scores.slice(),
    focus: null,
    shares: [],
    writing: null,
    teleport: null,
    done: false,
    leader: null,
  }];

  const outgoing = (index: number) => edges.filter((edge) => edge.from === index);

  for (let iteration = 1; iteration <= 6; iteration += 1) {
    const next = Array.from({ length: count }, () => teleport);
    const sent: { from: number; to: number; amount: number }[] = [];
    scores.forEach((score, index) => {
      const links = outgoing(index);
      const page = pages[index];
      if (links.length === 0) {
        const amount = (DAMPING * score) / count;
        next.forEach((_, target) => {
          next[target] += amount;
        });
        frames.push({
          kind: 'pagerank',
          caption: `${page?.id ?? ''} sends`,
          note: `${page?.id ?? ''} holds ${formatNumber(score)} and has no outgoing link, so 85% of that rank is shared across every page.`,
          pages,
          edges,
          scores: scores.slice(),
          focus: index,
          shares: [],
          writing: next.slice(),
          teleport: null,
          done: false,
          leader: null,
        });
        return;
      }
      const amount = (DAMPING * score) / links.length;
      links.forEach((edge) => {
        next[edge.to] += amount;
        sent.push({ from: index, to: edge.to, amount });
      });
      frames.push({
        kind: 'pagerank',
        caption: `${page?.id ?? ''} sends`,
        note: `${page?.id ?? ''} holds ${formatNumber(score)} and has ${links.length} outgoing link${links.length === 1 ? '' : 's'}. Each link carries 0.85 × ${formatNumber(score)} / ${links.length} = ${amount.toFixed(3)}.`,
        pages,
        edges,
        scores: scores.slice(),
        focus: index,
        shares: sent.filter((share) => share.from === index),
        writing: next.slice(),
        teleport: null,
        done: false,
        leader: null,
      });
    });
    const change = Math.max(...next.map((value, index) => Math.abs(value - (scores[index] ?? 0))));
    scores = next;
    const settled = change < 0.01 || iteration === 6;
    const leader = scores.reduce((best, value, index) => (value > (scores[best] ?? 0) ? index : best), 0);
    frames.push({
      kind: 'pagerank',
      caption: settled ? 'Ranks settled' : `After pass ${iteration}`,
      note: settled
        ? `With the teleport ${teleport.toFixed(4)} added to every page, the ranks are ${summary()}. Another pass would barely move them. ${pages[leader]?.id ?? ''} is highest.`
        : `Every page also receives the teleport ${teleport.toFixed(4)}. The ranks are now ${summary()}.`,
      pages,
      edges,
      scores: scores.slice(),
      focus: null,
      shares: [],
      writing: scores.slice(),
      teleport,
      done: settled,
      leader: settled ? leader : null,
    });
    if (settled) break;
  }

  return frames;
}
