import { useCallback, useState } from 'react';
import { useDictionary } from '../../dictionary/dictionary';
import MotionStage from './MotionStage';
import {
  calmCloth,
  getClothMode,
  paintCloth,
  resetClothClock,
  setClothMode,
  setClothPointer,
  strikeCloth,
  type ClothMode,
} from './clothScene';

export default function ClothPage() {
  const dictionary = useDictionary();
  const cloth = dictionary.motion.cloth;
  const [mode, setMode] = useState<ClothMode>(() => getClothMode());

  const paint = useCallback(paintCloth, []);

  function choose(next: ClothMode) {
    setClothMode(next);
    setMode(next);
  }

  return (
    <MotionStage
      title={dictionary.brand.titled(cloth.title)}
      leaveLabel={cloth.leave}
      hint={cloth.hint}
      summary={cloth.summary}
      paint={paint}
      onMount={resetClothClock}
      onUnmount={() => setClothPointer(0, 0, false)}
      onPointer={(x, y, active, strike) => {
        setClothPointer(x, y, active);
        if (strike && active && mode === 'poke') strikeCloth(x, y);
      }}
      modes={[
        { id: 'poke', label: cloth.poke, active: mode === 'poke', onClick: () => choose('poke') },
        { id: 'wind', label: cloth.wind, active: mode === 'wind', onClick: () => choose('wind') },
        { id: 'pulse', label: cloth.pulse, active: mode === 'pulse', onClick: () => choose('pulse') },
      ]}
      action={{ label: cloth.calm, onClick: calmCloth }}
    />
  );
}
