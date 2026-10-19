import { NavLink, useParams } from 'react-router';
import { getPathAlgorithm, pathAlgorithms } from '../../algorithms/path/catalog';
import { useDictionary } from '../../dictionary/dictionary';
import { useScrollActivePill } from '../../hooks/useScrollActivePill';
import PathLanding from './PathLanding';
import PathSimulator from './PathSimulator';

export default function PathPage() {
  const dictionary = useDictionary();
  const { algorithmId } = useParams();
  const algorithm = algorithmId ? getPathAlgorithm(algorithmId) : null;
  useScrollActivePill(algorithmId);

  if (!algorithmId) {
    return (
      <div className="page">
        <PathLanding />
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="algo-nav" aria-label={dictionary.pathfinding.nav}>
        {pathAlgorithms.map((item) => (
          <NavLink
            key={item.id}
            to={`/algorithms/pathfinding/${item.id}`}
            className={({ isActive }) => (isActive ? 'algo-pill active' : 'algo-pill')}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {algorithm
        ? <PathSimulator key={algorithm.id} algorithm={algorithm} />
        : (
          <section className="page-intro">
            <h1>{dictionary.pathfinding.missingTitle}</h1>
            <p>{dictionary.pathfinding.missingBody}</p>
          </section>
        )}
    </div>
  );
}
