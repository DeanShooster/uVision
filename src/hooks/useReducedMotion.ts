import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window === 'undefined' ? false : prefersReducedMotion()
  ));

  useEffect(() => {
    const query = window.matchMedia(QUERY);
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  return reduced;
}
