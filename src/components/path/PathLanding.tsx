import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { breadthFirst } from '../../algorithms/path/bfs';
import { pathAlgorithms } from '../../algorithms/path/catalog';
import { mapEdges, NODES } from '../../algorithms/path/graph';
import { useDictionary } from '../../dictionary/dictionary';
import { useLoop } from '../../hooks/useLoop';
import GraphView from './GraphView';

const DEMO = {
  nodes: NODES,
  edges: mapEdges('road'),
  start: 'A',
  goal: 'F',
} as const;

export default function PathLanding() {
  const dictionary = useDictionary();
  const frames = useMemo(() => breadthFirst({ ...DEMO, edges: DEMO.edges }), []);
  const frame = useLoop(frames);

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.pathfinding.documentTitle);
  }, [dictionary]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{dictionary.pathfinding.eyebrow}</p>
          <h1>{dictionary.pathfinding.title}</h1>
          <p className="lede">{dictionary.pathfinding.lede}</p>
          <div className="hero-actions">
            <Link to="/algorithms/pathfinding/dijkstra" className="button primary">{dictionary.pathfinding.start}</Link>
          </div>
        </div>
        <div className="hero-demo">
          <div className="hero-demo-top">
            <span>{dictionary.pathfinding.demo}</span>
            <Link to="/algorithms/pathfinding/bfs">{dictionary.pathfinding.openDemo}</Link>
          </div>
          {frame && <GraphView nodes={NODES} edges={DEMO.edges} frame={frame} start={DEMO.start} goal={DEMO.goal} />}
          <p className="hero-note">{frame?.note}</p>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>{dictionary.pathfinding.choose}</h2>
        </div>
        <div className="cube-grid">
          {pathAlgorithms.map((algorithm) => (
            <Link key={algorithm.id} to={`/algorithms/pathfinding/${algorithm.id}`} className="cube cube-plain">
              <h2>{algorithm.name}</h2>
              <p>{algorithm.blurb}</p>
              <h3 className="cube-cost-title">{dictionary.explanation.cost}</h3>
              <dl className="cube-cost">
                {(algorithm.costRows ?? []).map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{algorithm.complexity[key]}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
