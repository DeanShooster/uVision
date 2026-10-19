import type { Explainable } from '../../algorithms/types';
import { useDictionary } from '../../dictionary/dictionary';

export default function Explanation({ algorithm }: { algorithm: Explainable }) {
  const dictionary = useDictionary();
  const rows = algorithm.costRows ?? dictionary.explanation.rows;
  const works = algorithm.worksTitle ?? dictionary.explanation.howSort(algorithm.name);
  const reading = algorithm.readingTitle ?? dictionary.explanation.readingBars;
  return (
    <aside className="explain">
      <h2>{works}</h2>
      <p>{algorithm.how}</p>
      <ol className="explain-steps">
        {algorithm.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <h3>{dictionary.explanation.cost}</h3>
      <dl className="complexity">
        {rows.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{algorithm.complexity[key]}</dd>
          </div>
        ))}
      </dl>
      <h3>{reading}</h3>
      <p>{algorithm.simulatorNote}</p>
    </aside>
  );
}
