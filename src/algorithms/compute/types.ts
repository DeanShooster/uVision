export type Complex = { re: number; im: number };

export type EuclideanFrame = {
  kind: 'euclidean';
  caption: string;
  note: string;
  a: number;
  b: number;
  scale: number;
  quotient: number | null;
  remainder: number | null;
  dividend: number | null;
  divisor: number | null;
  done: boolean;
};

export type FftLink = {
  fromCol: number;
  top: number;
  bottom: number;
  active: boolean;
};

export type FftFrame = {
  kind: 'fft';
  caption: string;
  note: string;
  columns: (Complex | null)[][];
  links: FftLink[];
  order: number[];
  done: boolean;
};

export type RankPage = { id: string; x: number; y: number };

export type RankEdge = { from: number; to: number; bend: number };

export type RankGraph = { pages: RankPage[]; edges: RankEdge[] };

export type PageRankFrame = {
  kind: 'pagerank';
  caption: string;
  note: string;
  pages: RankPage[];
  edges: RankEdge[];
  scores: number[];
  focus: number | null;
  shares: { from: number; to: number; amount: number }[];
  writing: number[] | null;
  teleport: number | null;
  done: boolean;
  leader: number | null;
};

export type ComputeFrame = EuclideanFrame | FftFrame | PageRankFrame;
