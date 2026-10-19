import { useEffect, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { useScrollActivePill } from '../../hooks/useScrollActivePill';

export type LobbyPiece = {
  id: string;
  title: string;
  copy: string;
};

type PieceLobbyProps = {
  documentTitle: string;
  brandTitle: (page: string) => string;
  title: string;
  lede: string;
  navLabel: string;
  basePath: string;
  pieces: readonly LobbyPiece[];
  pieceId?: string;
  missingTitle: string;
  missingBody: string;
  renderPreview: (id: string) => ReactNode;
};

export default function PieceLobby({
  documentTitle,
  brandTitle,
  title,
  lede,
  navLabel,
  basePath,
  pieces,
  pieceId,
  missingTitle,
  missingBody,
  renderPreview,
}: PieceLobbyProps) {
  const piece = pieces.find((item) => item.id === pieceId);

  useEffect(() => {
    document.title = brandTitle(piece ? piece.title : documentTitle);
  }, [brandTitle, documentTitle, piece]);

  useScrollActivePill(pieceId);

  if (!pieceId) {
    return (
      <div className="page">
        <section className="home-hero">
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </section>
        <div className="cube-grid">
          {pieces.map((item) => (
            <Link key={item.id} to={`${basePath}/${item.id}`} className="cube">
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
              <div className="cube-stage" aria-hidden="true">
                {renderPreview(item.id)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="algo-nav" aria-label={navLabel}>
        {pieces.map((item) => (
          <NavLink
            key={item.id}
            to={`${basePath}/${item.id}`}
            className={({ isActive }) => (isActive ? 'algo-pill active' : 'algo-pill')}
          >
            {item.title}
          </NavLink>
        ))}
      </nav>

      {piece
        ? (
          <section className="page-intro">
            <h1>{piece.title}</h1>
            <p className="lede">{piece.copy}</p>
          </section>
        )
        : (
          <section className="page-intro">
            <h1>{missingTitle}</h1>
            <p>{missingBody}</p>
          </section>
        )}
    </div>
  );
}
