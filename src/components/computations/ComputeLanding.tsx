import { useEffect } from 'react';
import { Link } from 'react-router';
import { computeAlgorithms } from '../../algorithms/compute/catalog';
import { euclidean } from '../../algorithms/compute/euclidean';
import { COMPUTE_DEMO } from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { useLoop } from '../../hooks/useLoop';
import EuclideanView from './EuclideanView';

const DEMO = euclidean(COMPUTE_DEMO.a, COMPUTE_DEMO.b);

export default function ComputeLanding() {
  const dictionary = useDictionary();
  const frame = useLoop(DEMO);

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.computations.documentTitle);
  }, [dictionary]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{dictionary.computations.eyebrow}</p>
          <h1>{dictionary.computations.title}</h1>
          <p className="lede">{dictionary.computations.lede}</p>
          <div className="hero-actions">
            <Link to="/algorithms/computations/euclidean" className="button primary">{dictionary.computations.start}</Link>
          </div>
        </div>
        <div className="hero-demo">
          <div className="hero-demo-top">
            <span>{dictionary.computations.demo}</span>
            <Link to="/algorithms/computations/euclidean">{dictionary.computations.openDemo}</Link>
          </div>
          <div className="chart-stage graph-stage">
            {frame && <EuclideanView frame={frame} />}
          </div>
          <p className="hero-note">{frame?.note}</p>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>{dictionary.computations.choose}</h2>
        </div>
        <div className="cube-grid">
          {computeAlgorithms.map((algorithm) => (
            <Link key={algorithm.id} to={`/algorithms/computations/${algorithm.id}`} className="cube cube-plain">
              <h2>{algorithm.heading}</h2>
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
