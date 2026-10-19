import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { DELIVERY_NOTE_POLL_MS } from '../../constants/ui';
import { useDictionary } from '../../dictionary/dictionary';
import { useCanvasLoop } from '../../hooks/useCanvasLoop';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { deliveryNote, paintCity, requestDelivery } from './cityScene';

export default function CityPage() {
  const dictionary = useDictionary();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [house, setHouse] = useState('');
  const [note, setNote] = useState('');
  const [invalid, setInvalid] = useState(false);
  const city = dictionary.animations.city;

  useEffect(() => {
    document.title = dictionary.brand.titled(city.title);
  }, [dictionary, city.title]);

  useEffect(() => {
    document.body.classList.add('city-lock');
    return () => document.body.classList.remove('city-lock');
  }, []);

  const paint = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
  ) => {
    paintCity(ctx, width, height, time);
  }, []);

  useCanvasLoop(canvasRef, paint, reduced);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = deliveryNote();
      setNote((current) => (current === next ? current : next));
    }, DELIVERY_NOTE_POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  function deliver(event: FormEvent) {
    event.preventDefault();
    const number = Number(house);
    if (!Number.isInteger(number)) {
      setInvalid(true);
      return;
    }
    const result = requestDelivery(number);
    if (!result.ok) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setHouse('');
    setNote(result.note);
  }

  const lines = note.split('\n').filter((line) => line.length > 0);

  return (
    <div className="city-stage">
      <canvas ref={canvasRef} className="city-canvas" aria-hidden="true" />
      <Link className="stage-leave city-leave" to="/animations">{city.leave}</Link>
      <form className="city-delivery" onSubmit={deliver}>
        {lines.length > 0 ? (
          <div className="city-delivery-route">
            {lines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
          </div>
        ) : null}
        <input
          type="number"
          inputMode="numeric"
          aria-label={city.houseLabel}
          placeholder={city.housePlaceholder}
          className={invalid ? 'invalid' : undefined}
          aria-invalid={invalid}
          value={house}
          onChange={(event) => {
            setHouse(event.target.value);
            setInvalid(false);
          }}
        />
        <button type="submit">{city.deliver}</button>
      </form>
      <p className="sr-only">{city.summary}</p>
    </div>
  );
}
