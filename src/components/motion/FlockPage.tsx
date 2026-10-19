import { useCallback, useState } from 'react';
import { useDictionary } from '../../dictionary/dictionary';
import MotionStage from './MotionStage';
import {
  getFlockMode,
  paintFlock,
  resetFlockClock,
  scatterFlock,
  setFlockMode,
  setFlockPointer,
  type FlockMode,
} from './flockScene';

export default function FlockPage() {
  const dictionary = useDictionary();
  const flock = dictionary.motion.flock;
  const [mode, setMode] = useState<FlockMode>(() => getFlockMode());

  const paint = useCallback(paintFlock, []);

  function choose(next: FlockMode) {
    setFlockMode(next);
    setMode(next);
  }

  return (
    <MotionStage
      title={dictionary.brand.titled(flock.title)}
      leaveLabel={flock.leave}
      hint={flock.hint}
      summary={flock.summary}
      paint={paint}
      onMount={resetFlockClock}
      onUnmount={() => setFlockPointer(0, 0, false)}
      onPointer={(x, y, active) => setFlockPointer(x, y, active)}
      modes={[
        { id: 'attract', label: flock.attract, active: mode === 'attract', onClick: () => choose('attract') },
        { id: 'flee', label: flock.flee, active: mode === 'flee', onClick: () => choose('flee') },
      ]}
      action={{ label: flock.scatter, onClick: scatterFlock }}
    />
  );
}
