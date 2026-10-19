import { NavLink, useParams } from 'react-router';
import { computeAlgorithms, getComputeAlgorithm } from '../../algorithms/compute/catalog';
import { useDictionary } from '../../dictionary/dictionary';
import { useScrollActivePill } from '../../hooks/useScrollActivePill';
import ComputeLanding from './ComputeLanding';
import ComputeSimulator from './ComputeSimulator';

export default function ComputationsPage() {
  const dictionary = useDictionary();
  const { algorithmId } = useParams();
  const algorithm = algorithmId ? getComputeAlgorithm(algorithmId) : null;
  useScrollActivePill(algorithmId);

  if (!algorithmId) {
    return (
      <div className="page">
        <ComputeLanding />
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="algo-nav" aria-label={dictionary.computations.nav}>
        {computeAlgorithms.map((item) => (
          <NavLink
            key={item.id}
            to={`/algorithms/computations/${item.id}`}
            className={({ isActive }) => (isActive ? 'algo-pill active' : 'algo-pill')}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {algorithm
        ? <ComputeSimulator key={algorithm.id} algorithm={algorithm} />
        : (
          <section className="page-intro">
            <h1>{dictionary.computations.missingTitle}</h1>
            <p>{dictionary.computations.missingBody}</p>
          </section>
        )}
    </div>
  );
}
