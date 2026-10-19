import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useDictionary } from '../../dictionary/dictionary';
import { canvasPixelRatio } from '../../hooks/useCanvasLoop';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { beltEdges, fateFocus, holeBeat, holeFocus, HOLE_SECONDS, paintCloseup, paintSolarSystem, planetHits, pointInBelt, rogueBeat, rogueDisk, rogueFocus, ROGUE_END_SECONDS, ROGUE_SECONDS, sunDeathBeat, sunDisk, PLANET_BUTTONS } from './solarScene';
import type { RogueEnding, SceneClock, SceneKind } from './solarScene';

export default function SolarSystemPage() {
  const dictionary = useDictionary();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<HTMLCanvasElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hitRefs = useRef<Partial<Record<SceneKind, HTMLButtonElement>>>({});
  const openRef = useRef(false);
  const pointerRef = useRef({ x: -1000, y: -1000, angle: -24, on: false });
  const hoveredRef = useRef<SceneKind | null>(null);
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<SceneKind | null>(null);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [deathOn, setDeathOn] = useState(false);
  const [rogueOn, setRogueOn] = useState(false);
  const [holeOn, setHoleOn] = useState(false);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [endingChoice, setEndingChoice] = useState<RogueEnding | null>(null);
  const [deathLock, setDeathLock] = useState(false);
  const [beat, setBeat] = useState(0);
  const deathRef = useRef(0);
  const deathStart = useRef<number | null>(null);
  const rogueRef = useRef(0);
  const rogueStart = useRef<number | null>(null);
  const endingRef = useRef<RogueEnding | null>(null);
  const choiceRef = useRef(0);
  const choiceStart = useRef<number | null>(null);
  const choiceAsked = useRef(false);
  const holeRef = useRef(0);
  const holeStart = useRef<number | null>(null);
  const beatRef = useRef(0);
  const lockRef = useRef(false);
  const storyRef = useRef<HTMLDivElement>(null);
  openRef.current = selected !== null;

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.animations.solar.title);
  }, [dictionary]);

  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;
    story.scrollTop = story.scrollHeight;
  }, [beat]);

  useEffect(() => {
    document.body.classList.add('solar-lock');
    return () => document.body.classList.remove('solar-lock');
  }, []);

  useEffect(() => {
    const ship = shipRef.current;
    const wake = wakeRef.current;
    if (!ship || !wake) return undefined;
    const context = wake.getContext('2d');
    if (!context) return undefined;

    type Ember = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      size: number;
    };
    const embers: Ember[] = [];
    let lastX = 0;
    let lastY = 0;
    let angle = -24;
    let seen = false;
    let frame = 0;
    let alive = true;
    let last = performance.now();

    const spawn = (x: number, y: number, radians: number, speed: number) => {
      const burst = Math.min(7, 2 + speed * 0.16);
      for (let index = 0; index < burst; index += 1) {
        const spread = (Math.random() - 0.5) * 0.7;
        const power = 11 + Math.random() * 24 + speed * 2;
        const life = 1.15 + Math.random() * 0.7;
        embers.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: -Math.cos(radians + spread) * power + (Math.random() - 0.5) * 9,
          vy: -Math.sin(radians + spread) * power + (Math.random() - 0.5) * 9,
          life,
          max: life,
          size: 4 + Math.random() * 5,
        });
      }
    };

    const move = (event: PointerEvent) => {
      if (openRef.current) {
        ship.style.opacity = '0';
        pointerRef.current.on = false;
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const speed = Math.hypot(dx, dy);
      if (seen && speed > 2) angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const radians = angle * (Math.PI / 180);
      const bounds = canvasRef.current?.getBoundingClientRect();
      pointerRef.current = {
        x: bounds ? event.clientX - bounds.left : event.clientX,
        y: bounds ? event.clientY - bounds.top : event.clientY,
        angle,
        on: true,
      };
      if (seen && speed > 1 && !reduced) {
        spawn(event.clientX - Math.cos(radians) * 25, event.clientY - Math.sin(radians) * 25, radians, speed);
      }
      seen = true;
      lastX = event.clientX;
      lastY = event.clientY;
      ship.style.transform = `translate(${event.clientX}px, ${event.clientY}px) rotate(${angle}deg)`;
      ship.style.opacity = '1';
    };
    const hide = () => {
      ship.style.opacity = '0';
    };

    const drawWake = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ratio = canvasPixelRatio();
      const width = wake.clientWidth;
      const height = wake.clientHeight;
      const nextWidth = Math.max(1, Math.floor(width * ratio));
      const nextHeight = Math.max(1, Math.floor(height * ratio));
      if (wake.width !== nextWidth || wake.height !== nextHeight) {
        wake.width = nextWidth;
        wake.height = nextHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';
      for (let index = embers.length - 1; index >= 0; index -= 1) {
        const ember = embers[index];
        ember.life -= dt;
        if (ember.life <= 0) {
          embers.splice(index, 1);
          continue;
        }
        ember.x += ember.vx * dt;
        ember.y += ember.vy * dt;
        ember.vx *= 0.985;
        ember.vy *= 0.985;
        const age = 1 - ember.life / ember.max;
        const alpha = Math.sin((ember.life / ember.max) * Math.PI);
        const radius = ember.size * (0.5 + age * 0.85);
        const glow = context.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, radius);
        glow.addColorStop(0, `rgba(255, 250, 230, ${0.5 * alpha})`);
        glow.addColorStop(0.28, `rgba(255, 176, 40, ${0.38 * alpha})`);
        glow.addColorStop(0.62, `rgba(255, 70, 8, ${0.16 * alpha})`);
        glow.addColorStop(1, 'rgba(180, 20, 0, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(ember.x, ember.y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(drawWake);
    };

    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', hide);
    frame = requestAnimationFrame(drawWake);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', hide);
    };
  }, [reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let frame = 0;
    let alive = true;
    const started = performance.now();

    const paint = (now: number) => {
      const ratio = canvasPixelRatio();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const nextWidth = Math.max(1, Math.floor(width * ratio));
      const nextHeight = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const shown = reduced ? 8 : ((now - started) / 1000) * 0.8;
      if (deathStart.current !== null) {
        const elapsed = (now - deathStart.current) / 1000;
        deathRef.current = reduced ? 1 : Math.min(1, elapsed / 44);
        rogueRef.current = 0;
        choiceRef.current = 0;
        holeRef.current = 0;
        const nextBeat = sunDeathBeat(deathRef.current);
        if (nextBeat !== beatRef.current) {
          beatRef.current = nextBeat;
          setBeat(nextBeat);
        }
      } else if (rogueStart.current !== null) {
        deathRef.current = 0;
        holeRef.current = 0;
        if (endingRef.current === null) {
          const elapsed = (now - rogueStart.current) / 1000;
          rogueRef.current = reduced ? 1 : Math.min(1, elapsed / ROGUE_SECONDS);
          const nextBeat = rogueBeat(rogueRef.current);
          if (nextBeat !== beatRef.current) {
            beatRef.current = nextBeat;
            setBeat(nextBeat);
          }
          if (rogueRef.current >= 1 && !choiceAsked.current) {
            choiceAsked.current = true;
            setAwaitingChoice(true);
          }
        } else if (choiceStart.current !== null) {
          rogueRef.current = 1;
          const elapsed = (now - choiceStart.current) / 1000;
          choiceRef.current = reduced ? 1 : Math.min(1, elapsed / ROGUE_END_SECONDS);
          if (beatRef.current < 4) {
            beatRef.current = 4;
            setBeat(4);
          }
        }
      } else if (holeStart.current !== null) {
        deathRef.current = 0;
        rogueRef.current = 0;
        choiceRef.current = 0;
        const elapsed = (now - holeStart.current) / 1000;
        holeRef.current = reduced ? 1 : Math.min(1, elapsed / HOLE_SECONDS);
        const nextBeat = holeBeat(holeRef.current);
        if (nextBeat !== beatRef.current) {
          beatRef.current = nextBeat;
          setBeat(nextBeat);
        }
      } else {
        deathRef.current = 0;
        rogueRef.current = 0;
        choiceRef.current = 0;
        holeRef.current = 0;
      }
      const waiting = rogueStart.current !== null && endingRef.current === null && rogueRef.current >= 1;
      const endingPlay = endingRef.current !== null && choiceRef.current < 1;
      const playing = (deathStart.current !== null && deathRef.current < 1) || (rogueStart.current !== null && rogueRef.current < 1) || waiting || endingPlay || (holeStart.current !== null && holeRef.current < 1);
      if (playing !== lockRef.current) {
        lockRef.current = playing;
        setDeathLock(playing);
      }
      const clock: SceneClock = {
        sun: deathRef.current,
        rogue: rogueRef.current,
        ending: endingRef.current,
        choice: choiceRef.current,
        hole: holeRef.current,
      };
      paintSolarSystem(context, width, height, shown, clock);
      const pointer = pointerRef.current;
      const radians = pointer.angle * (Math.PI / 180);
      const nose = { x: pointer.x, y: pointer.y };
      const tail = {
        x: pointer.x - Math.cos(radians) * 30,
        y: pointer.y - Math.sin(radians) * 30,
      };
      const hits = planetHits(width, height, shown, clock);
      hits.forEach((hit) => {
        const button = hitRefs.current[hit.kind];
        if (!button) return;
        const size = hit.radius * 2;
        button.style.display = hit.gone ? 'none' : '';
        button.style.width = `${size}px`;
        button.style.height = `${size}px`;
        button.style.transformOrigin = '0 0';
        button.style.transform = `translate(${hit.x - size / 2}px, ${hit.y - size / 2}px)`;
      });
      const sun = sunDisk(width, height, clock);
      const rogue = rogueDisk(width, height, clock, shown);
      const rogueButton = hitRefs.current.rogue;
      if (rogueButton) {
        if (!rogue) rogueButton.style.display = 'none';
        else {
          const size = Math.max(rogue.body * 2, 48);
          rogueButton.style.display = '';
          rogueButton.style.width = `${size}px`;
          rogueButton.style.height = `${size}px`;
          rogueButton.style.transformOrigin = '0 0';
          rogueButton.style.transform = `translate(${rogue.x - size / 2}px, ${rogue.y - size / 2}px)`;
        }
      }
      const sunButton = hitRefs.current.sun;
      if (sunButton) {
        const size = Math.max(sun.body * 2, 44);
        sunButton.style.width = `${size}px`;
        sunButton.style.height = `${size}px`;
        sunButton.style.transformOrigin = '0 0';
        sunButton.style.transform = `translate(${sun.x - size / 2}px, ${sun.y - size / 2}px)`;
      }
      const shipOn = (hit: { x: number; y: number; body: number }, pad: number) => {
        if (!pointer.on) return false;
        const dx = tail.x - nose.x;
        const dy = tail.y - nose.y;
        const span = dx * dx + dy * dy || 1;
        const along = Math.max(0, Math.min(1, ((hit.x - nose.x) * dx + (hit.y - nose.y) * dy) / span));
        const nearestX = nose.x + dx * along;
        const nearestY = nose.y + dy * along;
        return Math.hypot(nearestX - hit.x, nearestY - hit.y) <= hit.body + pad;
      };
      const hovered = hits.reduce<(typeof hits)[number] | null>((best, hit) => {
        if (!shipOn(hit, 12)) return best;
        if (!best || hit.y >= best.y) return hit;
        return best;
      }, null);
      const onSun = !hovered && shipOn(sun, 6);
      const onBelt = !hovered && !onSun && pointer.on && [0, 0.35, 0.7, 1].some((step) => (
        pointInBelt(
          width,
          height,
          nose.x + (tail.x - nose.x) * step,
          nose.y + (tail.y - nose.y) * step,
          clock,
        )
      ));
      if (openRef.current || lockRef.current) hoveredRef.current = null;
      else if (hovered) hoveredRef.current = hovered.kind;
      else if (onSun) hoveredRef.current = 'sun';
      else if (onBelt) hoveredRef.current = 'belt';
      else hoveredRef.current = null;
      if (!openRef.current && !lockRef.current && (hovered || onSun || onBelt)) {
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.strokeStyle = 'rgba(255, 244, 210, 0.95)';
        context.lineWidth = 1.4;
        context.shadowColor = 'rgba(255, 214, 120, 0.9)';
        context.shadowBlur = 5;
        context.beginPath();
        if (hovered) context.arc(hovered.x, hovered.y, hovered.body, 0, Math.PI * 2);
        else if (onSun) context.arc(sun.x, sun.y, sun.body, 0, Math.PI * 2);
        else {
          const belt = beltEdges(width, height, clock);
          context.ellipse(belt.cx, belt.cy, belt.inner, belt.inner * belt.tilt, 0, 0, Math.PI * 2);
          context.ellipse(belt.cx, belt.cy, belt.outer, belt.outer * belt.tilt, 0, 0, Math.PI * 2);
        }
        context.stroke();
        context.restore();
      }
    };

    const draw = (now: number) => {
      if (!alive) return;
      paint(now);
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(() => paint(performance.now()));
    observer.observe(canvas);
    document.fonts.ready.then(() => {
      if (alive) paint(performance.now());
    }).catch(() => undefined);

    if (reduced) paint(started);
    else frame = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);

  useEffect(() => {
    const press = (event: PointerEvent) => {
      if (openRef.current || lockRef.current) return;
      const target = event.target;
      if (target instanceof Element && target.closest('.solar-leave, .solar-popup, button')) return;
      const kind = hoveredRef.current;
      if (!kind) return;
      setSelected(kind);
    };
    window.addEventListener('click', press);
    return () => window.removeEventListener('click', press);
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const canvas = portraitRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    if (shipRef.current) shipRef.current.style.opacity = '0';

    let frame = 0;
    let alive = true;
    const started = performance.now();

    const paint = (now: number) => {
      const ratio = canvasPixelRatio();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const nextWidth = Math.max(1, Math.floor(width * ratio));
      const nextHeight = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paintCloseup(context, width, height, selected, reduced ? 1.4 : (now - started) / 1000, {
        sun: deathRef.current,
        rogue: rogueRef.current,
        ending: endingRef.current,
        choice: choiceRef.current,
        hole: holeRef.current,
      });
    };

    const draw = (now: number) => {
      if (!alive) return;
      paint(now);
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    if (reduced) paint(started);
    else frame = requestAnimationFrame(draw);
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [reduced, selected]);

  const solar = dictionary.animations.solar;
  const chosen = PLANET_BUTTONS.find((planet) => planet.kind === selected);
  const focus = selected && rogueRef.current <= 0 && holeRef.current <= 0 ? fateFocus(selected, deathRef.current) : 'present';
  const holeKey = selected ? holeFocus(selected, holeRef.current) : 'present';
  const rogueKey = selected ? rogueFocus(selected, {
    sun: deathRef.current,
    rogue: rogueRef.current,
    ending: endingRef.current,
    choice: choiceRef.current,
    hole: holeRef.current,
  }) : 'present';
  const rogueText = (field: 'rogueAbout' | 'rogueDetail') => {
    if (!endingChoice || rogueKey === 'present') return '';
    const pack = solar[field];
    if (rogueKey === 'sun' || rogueKey === 'earth' || rogueKey === 'mars') return pack[rogueKey][endingChoice];
    if (rogueKey === 'rogue') return pack.rogue;
    return pack.shared[rogueKey];
  };
  const named = (kind: string) => kind === 'sun' || kind === 'belt' ? solar.names[kind] : chosen?.name;
  const title = holeKey !== 'present'
    ? named(holeKey)
    : rogueKey === 'rogue'
      ? 'Rogue'
      : rogueKey !== 'present'
        ? named(rogueKey)
        : focus === 'dwarf' || focus === 'giant'
          ? solar.fateNames[focus]
          : selected === 'sun' || selected === 'belt'
            ? solar.names[selected]
            : chosen?.name;
  const about = holeKey !== 'present'
    ? solar.holeAbout[holeKey]
    : rogueKey !== 'present'
      ? rogueText('rogueAbout')
      : focus === 'present'
        ? selected && selected !== 'rogue' ? solar.about[selected] : ''
        : solar.fateAbout[focus];
  const detail = holeKey !== 'present'
    ? solar.holeDetail[holeKey]
    : rogueKey !== 'present'
      ? rogueText('rogueDetail')
      : focus === 'present'
        ? selected && selected !== 'rogue' ? solar.detail[selected] : ''
        : solar.fateDetail[focus];
  const storyLines = holeOn
    ? solar.holeBeats.slice(0, beat + 1)
    : rogueOn
      ? [
        ...solar.rogueBeats.slice(0, Math.min(beat + 1, solar.rogueBeats.length)),
        ...(beat >= 4 && endingChoice ? [solar.rogueEndings[endingChoice]] : []),
      ]
      : solar.sunDeathBeats.slice(0, beat + 1);
  const clearRogue = () => {
    rogueStart.current = null;
    rogueRef.current = 0;
    endingRef.current = null;
    choiceRef.current = 0;
    choiceStart.current = null;
    choiceAsked.current = false;
    setRogueOn(false);
    setAwaitingChoice(false);
    setEndingChoice(null);
  };
  const clearHole = () => {
    holeStart.current = null;
    holeRef.current = 0;
    setHoleOn(false);
  };
  const playSunDeath = () => {
    clearRogue();
    clearHole();
    deathStart.current = performance.now();
    deathRef.current = reduced ? 1 : 0;
    beatRef.current = 0;
    lockRef.current = !reduced;
    setBeat(0);
    setDeathLock(!reduced);
    setDeathOn(true);
    setSelected(null);
  };
  const playRogue = () => {
    deathStart.current = null;
    deathRef.current = 0;
    setDeathOn(false);
    clearHole();
    clearRogue();
    rogueStart.current = performance.now();
    rogueRef.current = reduced ? 1 : 0;
    beatRef.current = 0;
    lockRef.current = true;
    setBeat(reduced ? 3 : 0);
    setDeathLock(true);
    setRogueOn(true);
    setAwaitingChoice(reduced);
    if (reduced) choiceAsked.current = true;
    setSelected(null);
  };
  const pickEnding = (ending: RogueEnding) => {
    endingRef.current = ending;
    choiceStart.current = performance.now();
    choiceRef.current = reduced ? 1 : 0;
    beatRef.current = 4;
    lockRef.current = !reduced;
    setBeat(4);
    setEndingChoice(ending);
    setAwaitingChoice(false);
    setDeathLock(!reduced);
  };
  const playHole = () => {
    deathStart.current = null;
    deathRef.current = 0;
    setDeathOn(false);
    clearRogue();
    holeStart.current = performance.now();
    holeRef.current = reduced ? 1 : 0;
    beatRef.current = reduced ? solar.holeBeats.length - 1 : 0;
    lockRef.current = !reduced;
    setBeat(beatRef.current);
    setDeathLock(!reduced);
    setHoleOn(true);
    setSelected(null);
  };
  const restorePresent = () => {
    deathStart.current = null;
    deathRef.current = 0;
    beatRef.current = 0;
    lockRef.current = false;
    clearRogue();
    clearHole();
    setBeat(0);
    setDeathLock(false);
    setDeathOn(false);
  };

  return (
    <div className={deathLock ? 'solar-stage solar-locked' : 'solar-stage'}>
      <canvas ref={canvasRef} className="solar-canvas" aria-hidden="true" />
      <canvas ref={wakeRef} className="solar-wake" aria-hidden="true" />
      <Link className="solar-leave" to="/animations">{solar.leave}</Link>
      <div className="solar-events">
        {deathOn || rogueOn || holeOn ? (
          <div className="solar-event-note" ref={storyRef}>
            {storyLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        {eventsOpen ? (
          <div className="solar-event-row" id="solar-disasters">
            <button type="button" className="solar-event" aria-pressed={deathOn} onClick={playSunDeath}>
              {solar.sunDeath}
            </button>
            <button type="button" className="solar-event" aria-pressed={rogueOn} onClick={playRogue}>
              {solar.roguePlanet}
            </button>
            <button type="button" className="solar-event" aria-pressed={holeOn} onClick={playHole}>
              {solar.blackHole}
            </button>
          </div>
        ) : null}
        <div className="solar-event-row">
          <button
            type="button"
            className="solar-event"
            aria-expanded={eventsOpen}
            aria-controls="solar-disasters"
            onClick={() => setEventsOpen((open) => !open)}
          >
            {solar.disasters}
            <span className="solar-event-caret" aria-hidden="true" />
          </button>
          {deathOn || rogueOn || holeOn ? (
            <button type="button" className="solar-event" onClick={restorePresent}>
              {solar.present}
            </button>
          ) : null}
        </div>
      </div>
      <div className="solar-ship" ref={shipRef} aria-hidden="true">
        <svg viewBox="0 0 68 32" width="34" height="16">
          <ellipse className="solar-ship-flame" cx="7" cy="16" rx="7" ry="3.2" fill="#ff8a1e" />
          <ellipse cx="9" cy="16" rx="3" ry="1.4" fill="#fff4d0" />
          <path d="M24 16 L16 4 L34 12 Z" fill="#102838" stroke="#7ee0d6" strokeWidth="1" />
          <path d="M24 16 L16 28 L34 20 Z" fill="#102838" stroke="#7ee0d6" strokeWidth="1" />
          <path d="M12 16 L60 16 L46 11.2 L34 16 L46 20.8 Z" fill="#e7fbf8" stroke="#071018" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M40 16 L60 16 L48 13 Z" fill="#9af6ee" />
          <path d="M40 16 L60 16 L48 19 Z" fill="#14958c" />
          <circle cx="36" cy="16" r="2" fill="#f6f1e6" stroke="#0c4f4c" strokeWidth="0.6" />
        </svg>
      </div>
      <p className="sr-only">{solar.summary}</p>
      <button
        type="button"
        className="solar-planet-hit"
        data-body="rogue"
        aria-label="Rogue"
        ref={(node) => {
          hitRefs.current.rogue = node ?? undefined;
        }}
        onClick={() => { if (lockRef.current) return; setSelected('rogue'); }}
      />
      <button
        type="button"
        className="solar-planet-hit"
        data-body="sun"
        aria-label={dictionary.animations.solar.names.sun}
        ref={(node) => {
          hitRefs.current.sun = node ?? undefined;
        }}
        onClick={() => { if (lockRef.current) return; setSelected('sun'); }}
      />
      <button
        type="button"
        className="sr-only"
        onClick={() => { if (lockRef.current) return; setSelected('belt'); }}
      >
        {dictionary.animations.solar.names.belt}
      </button>
      {PLANET_BUTTONS.map((planet) => (
        <button
          key={planet.kind}
          type="button"
          className="solar-planet-hit"
          aria-label={planet.name}
          ref={(node) => {
            hitRefs.current[planet.kind] = node ?? undefined;
          }}
          onClick={() => { if (lockRef.current) return; setSelected(planet.kind); }}
        />
      ))}
      {selected ? (
        <div className="solar-popup" role="presentation" onClick={() => setSelected(null)}>
          <div
            className="solar-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solar-planet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button ref={closeRef} type="button" className="solar-popup-close" onClick={() => setSelected(null)}>
              {solar.close}
            </button>
            <canvas ref={portraitRef} className="solar-portrait" aria-hidden="true" />
            <h2 id="solar-planet-title">{title}</h2>
            <p>{about}</p>
            <p>{detail}</p>
          </div>
        </div>
      ) : null}
      {awaitingChoice ? (
        <div className="solar-choice">
          <div className="solar-choice-card" role="dialog" aria-modal="true" aria-labelledby="rogue-choice-title">
            <h2 id="rogue-choice-title">{solar.rogueChoiceTitle}</h2>
            <p>{solar.rogueChoiceLede}</p>
            {(['eject', 'capture', 'star'] as const).map((ending) => (
              <button key={ending} type="button" onClick={() => pickEnding(ending)}>
                <strong>{solar.rogueChoices[ending].title}</strong>
                {solar.rogueChoices[ending].copy}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
