import { NavLink, useParams } from 'react-router';
import { algorithms, getAlgorithm } from '../../algorithms/catalog';
import { useDictionary } from '../../dictionary/dictionary';
import { useScrollActivePill } from '../../hooks/useScrollActivePill';
import Simulator from './Simulator';
import SortLanding from './SortLanding';

export default function SortPage() {
  const dictionary = useDictionary();
  const { algorithmId } = useParams();
  const algorithm = algorithmId ? getAlgorithm(algorithmId) : null;
  useScrollActivePill(algorithmId);

  if (!algorithmId) {
    return (
      <div className="page">
        <SortLanding />
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="algo-nav" aria-label={dictionary.sorting.nav}>
        {algorithms.map((item) => (
          <NavLink
            key={item.id}
            to={`/algorithms/sorting/${item.id}`}
            className={({ isActive }) => (isActive ? 'algo-pill active' : 'algo-pill')}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {algorithm
        ? <Simulator key={algorithm.id} algorithm={algorithm} />
        : (
          <section className="page-intro">
            <h1>{dictionary.sorting.missingTitle}</h1>
            <p>{dictionary.sorting.missingBody}</p>
          </section>
        )}
    </div>
  );
}
