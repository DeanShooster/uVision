import { useEffect } from 'react';

/** Keeps the active algorithm/piece pill visible in horizontal navs. */
export function useScrollActivePill(activeId: string | undefined) {
  useEffect(() => {
    if (!activeId) return undefined;
    const active = document.querySelector('.algo-pill.active');
    active?.scrollIntoView({ inline: 'center', block: 'nearest' });
    return undefined;
  }, [activeId]);
}
