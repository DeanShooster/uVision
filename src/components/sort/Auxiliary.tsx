import { formatNum } from '../../algorithms/frame';
import type { SortAux } from '../../algorithms/types';

export default function Auxiliary({ aux }: { aux: SortAux | null }) {
  if (!aux) return null;

  if (aux.kind === 'count') {
    return (
      <div className="aux">
        <p className="aux-label">{aux.label}</p>
        <div className="count-table">
          {aux.cells.map((count, value) => (
            <div
              key={value}
              className={aux.active === value ? 'count-cell active' : 'count-cell'}
            >
              <span className="count-number">{count}</span>
              <span className="count-key">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="aux">
      <p className="aux-label">{aux.label}</p>
      <div className="bucket-table">
        {aux.buckets.map((bucket, index) => (
          <div
            key={index}
            className={aux.active === index ? 'bucket-cell active' : 'bucket-cell'}
          >
            <div className="bucket-values">
              {bucket.length === 0
                ? <span className="bucket-empty">–</span>
                : bucket.map((value, valueIndex) => (
                  <span key={`${value}-${valueIndex}`}>{formatNum(value)}</span>
                ))}
            </div>
            <span className="count-key">{index}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
