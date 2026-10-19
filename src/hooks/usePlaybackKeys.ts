import { useEffect, useRef } from 'react';

type PlaybackKeyHandlers = {
  togglePlay: () => void;
  step: (direction: number) => void;
};

/** Stable Space / arrow-key bindings for simulator playback. */
export function usePlaybackKeys(handlers: PlaybackKeyHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof Element && target.matches('input, textarea, select, button')) return;
      if (event.key === ' ') {
        event.preventDefault();
        handlersRef.current.togglePlay();
      } else if (event.key === 'ArrowRight') {
        handlersRef.current.step(1);
      } else if (event.key === 'ArrowLeft') {
        handlersRef.current.step(-1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
