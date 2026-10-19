import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { LuMenu, LuX } from 'react-icons/lu';
import { useDictionary } from '../../dictionary/dictionary';

const taglineTone: Record<string, string> = {
  and: 'join',
  'Algorithms,': 'algo',
  Algorithms: 'algo',
  Animations: 'world',
  Motions: 'brand',
};

export default function AppShell() {
  const dictionary = useDictionary();
  const links = [
    { to: '/', label: dictionary.nav.home, end: true },
    { to: '/algorithms', label: dictionary.nav.algorithms },
    { to: '/animations', label: dictionary.nav.animations },
    { to: '/motion', label: dictionary.nav.motion },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      <header className="site-header">
        <NavLink to="/" className="brand" end aria-label={`${dictionary.brand.name} ${dictionary.brand.tagline}`}>
          <img className="brand-mark" src="/favicon.png" alt="" />
          <span className="brand-lockup">
            <strong className="brand-name">
              <span className="brand-lead">{dictionary.brand.name.slice(0, 1)}</span>{dictionary.brand.name.slice(1)}
            </strong>
            <small className="brand-tagline">
              {dictionary.brand.tagline.split(' ').map((word, index) => (
                <span key={`${word}-${index}`} data-tone={taglineTone[word] ?? 'lead'}>{word}</span>
              ))}
            </small>
          </span>
        </NavLink>
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <LuX /> : <LuMenu />}
          <span className="sr-only">{menuOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}</span>
        </button>
        <nav id="site-nav" className={menuOpen ? 'site-nav open' : 'site-nav'}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="shell">
        <Outlet />
      </main>
      <footer className="site-footer">
        <h2 className="footer-title">{dictionary.about.title}</h2>
        <div className="footer-about">
          {dictionary.about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </footer>
    </div>
  );
}
