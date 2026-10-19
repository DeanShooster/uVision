import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { bubbleSort } from '../../algorithms/bubble';
import { algorithms } from '../../algorithms/catalog';
import { SORT_DEMO_VALUES } from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { useLoop } from '../../hooks/useLoop';
import BarChart from './BarChart';

export default function SortLanding() {
  const dictionary = useDictionary();
  const frames = useMemo(() => bubbleSort([...SORT_DEMO_VALUES]), []);
  const frame = useLoop(frames);

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.sorting.documentTitle);
  }, [dictionary]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{dictionary.sorting.eyebrow}</p>
          <h1>{dictionary.sorting.title}</h1>
          <p className="lede">{dictionary.sorting.lede}</p>
          <div className="hero-actions">
            <Link to="/algorithms/sorting/selection" className="button primary">{dictionary.sorting.start}</Link>
          </div>
        </div>
        <div className="hero-demo">
          <div className="hero-demo-top">
            <span>{dictionary.sorting.demo}</span>
            <Link to="/algorithms/sorting/bubble">{dictionary.sorting.openDemo}</Link>
          </div>
          {frame && <BarChart frame={frame} compact />}
          <p className="hero-note">{frame?.note}</p>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>{dictionary.sorting.choose}</h2>
        </div>
        <div className="cube-grid">
          {algorithms.map((algorithm) => (
            <Link key={algorithm.id} to={`/algorithms/sorting/${algorithm.id}`} className="cube cube-plain">
              <h2>{algorithm.name}</h2>
              <p>{algorithm.blurb}</p>
              <h3 className="cube-cost-title">{dictionary.explanation.cost}</h3>
              <dl className="cube-cost">
                {dictionary.explanation.rows.map(([key, label]) => (
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
