import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { algorithms } from '../../algorithms/catalog';
import { euclidean } from '../../algorithms/compute/euclidean';
import type { EuclideanFrame } from '../../algorithms/compute/types';
import { pathAlgorithms } from '../../algorithms/path/catalog';
import { mapEdges, NODES } from '../../algorithms/path/graph';
import type { GraphEdge, PathFrame } from '../../algorithms/path/types';
import type { SortFrame } from '../../algorithms/types';
import { useDictionary } from '../../dictionary/dictionary';
import EuclideanView from '../computations/EuclideanView';
import GraphView from '../path/GraphView';
import BarChart from '../sort/BarChart';
import { useLoop } from '../../hooks/useLoop';

const ROUTES = ['/algorithms/sorting', '/algorithms/pathfinding', '/algorithms/computations'];

function SortPreview() {
  const [frames] = useState<SortFrame[]>(() => {
    const algorithm = algorithms.find((item) => item.id === 'bubble');
    return algorithm ? algorithm.sort(algorithm.example) : [];
  });
  const frame = useLoop(frames);
  return frame ? <BarChart frame={frame} compact /> : null;
}

function PathPreview() {
  const [demo] = useState<{ edges: GraphEdge[]; frames: PathFrame[] }>(() => {
    const edges = mapEdges('road');
    const algorithm = pathAlgorithms.find((item) => item.id === 'bfs');
    const frames = algorithm ? algorithm.run({ nodes: NODES, edges, start: 'A', goal: 'F' }) : [];
    return { edges, frames };
  });
  const frame = useLoop(demo.frames);
  return <GraphView nodes={NODES} edges={demo.edges} frame={frame} start="A" goal="F" />;
}

function ComputePreview() {
  const [frames] = useState<EuclideanFrame[]>(() => euclidean(48, 18));
  const frame = useLoop(frames);
  return frame ? <EuclideanView frame={frame} /> : null;
}

const PREVIEWS = [SortPreview, PathPreview, ComputePreview];

export default function AlgorithmsPage() {
  const dictionary = useDictionary();

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.algorithms.documentTitle);
  }, [dictionary]);

  return (
    <div className="page">
      <section className="home-hero">
        <h1>{dictionary.algorithms.title}</h1>
        <p className="lede">{dictionary.algorithms.lede}</p>
      </section>
      <div className="cube-grid">
        {dictionary.algorithms.categories.map((category, index) => {
          const Preview = PREVIEWS[index];
          return (
            <Link key={ROUTES[index]} to={ROUTES[index]} className="cube">
              <h2>{category.title}</h2>
              <p>{category.copy}</p>
              <div className="cube-stage" aria-hidden="true">
                {Preview && <Preview />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
