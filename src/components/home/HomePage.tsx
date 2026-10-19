import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { algorithms } from '../../algorithms/catalog';
import { pathAlgorithms } from '../../algorithms/path/catalog';
import { randomGraph } from '../../algorithms/path/graph';
import { HOME_LOOP_STEP_MS, HOME_PATH_GRAPH_NODES } from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import ScenePreview from '../animations/ScenePreview';
import MotionPreview from '../motion/MotionPreview';
import GraphView from '../path/GraphView';
import BarChart from '../sort/BarChart';
import { useLoop } from '../../hooks/useLoop';

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function HomePage() {
  const [sortDemo] = useState(() => {
    const algorithm = pick(algorithms);
    return { algorithm, frames: algorithm.sort(algorithm.presets.random()) };
  });
  const [pathDemo] = useState(() => {
    const algorithm = pick(pathAlgorithms);
    const graph = randomGraph({ count: HOME_PATH_GRAPH_NODES });
    const start = graph.nodes[0].id;
    const goal = graph.nodes[graph.nodes.length - 1].id;
    return {
      algorithm,
      graph,
      start,
      goal,
      frames: algorithm.run({ nodes: graph.nodes, edges: graph.edges, start, goal }),
    };
  });
  const sortFrame = useLoop(sortDemo.frames, HOME_LOOP_STEP_MS);
  const pathFrame = useLoop(pathDemo.frames, HOME_LOOP_STEP_MS);
  const dictionary = useDictionary();
  const solar = dictionary.animations.pieces.find((item) => item.id === 'solar-system');
  const city = dictionary.animations.pieces.find((item) => item.id === 'city-delivery');
  const flock = dictionary.motion.pieces.find((item) => item.id === 'flock');
  const cloth = dictionary.motion.pieces.find((item) => item.id === 'cloth');

  useEffect(() => {
    document.title = dictionary.brand.homeTitle;
  }, [dictionary.brand.homeTitle]);

  return (
    <div className="page">
      <section className="home-hero">
        <h1>{dictionary.home.title}</h1>
        <p className="lede">{dictionary.home.lede}</p>
      </section>

      <div className="home-stage">
        <div className="home-live">
          <article className="home-live-card">
            <div className="home-live-top">
              <span className="eyebrow">{sortDemo.algorithm.name}</span>
              <Link to={`/algorithms/sorting/${sortDemo.algorithm.id}`}>{dictionary.home.open}</Link>
            </div>
            <div className="chart-stage">
              {sortFrame && <BarChart frame={sortFrame} compact />}
            </div>
            <p className="home-live-copy">{sortDemo.algorithm.how}</p>
          </article>

          <article className="home-live-card">
            <div className="home-live-top">
              <span className="eyebrow">{pathDemo.algorithm.name}</span>
              <Link to={`/algorithms/pathfinding/${pathDemo.algorithm.id}`}>{dictionary.home.open}</Link>
            </div>
            <div className="chart-stage graph-stage">
              {pathFrame && (
                <GraphView
                  nodes={pathDemo.graph.nodes}
                  edges={pathDemo.graph.edges}
                  frame={pathFrame}
                  start={pathDemo.start}
                  goal={pathDemo.goal}
                />
              )}
            </div>
            <p className="home-live-copy">{pathDemo.algorithm.how}</p>
          </article>

          {solar ? (
            <article className="home-live-card">
              <div className="home-live-top">
                <span className="eyebrow">{solar.title}</span>
                <Link to="/animations/solar-system">{dictionary.home.open}</Link>
              </div>
              <div className="chart-stage home-scene">
                <ScenePreview id={solar.id} />
              </div>
              <p className="home-live-copy">{solar.copy}</p>
            </article>
          ) : null}

          {city ? (
            <article className="home-live-card">
              <div className="home-live-top">
                <span className="eyebrow">{city.title}</span>
                <Link to="/animations/city-delivery">{dictionary.home.open}</Link>
              </div>
              <div className="chart-stage home-scene">
                <ScenePreview id={city.id} />
              </div>
              <p className="home-live-copy">{city.copy}</p>
            </article>
          ) : null}

          {flock ? (
            <article className="home-live-card">
              <div className="home-live-top">
                <span className="eyebrow">{flock.title}</span>
                <Link to="/motion/flock">{dictionary.home.open}</Link>
              </div>
              <div className="chart-stage home-scene">
                <MotionPreview id={flock.id} />
              </div>
              <p className="home-live-copy">{flock.copy}</p>
            </article>
          ) : null}

          {cloth ? (
            <article className="home-live-card">
              <div className="home-live-top">
                <span className="eyebrow">{cloth.title}</span>
                <Link to="/motion/cloth">{dictionary.home.open}</Link>
              </div>
              <div className="chart-stage home-scene">
                <MotionPreview id={cloth.id} />
              </div>
              <p className="home-live-copy">{cloth.copy}</p>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}
