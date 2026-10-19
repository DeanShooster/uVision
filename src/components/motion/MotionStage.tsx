import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router';
import { useCanvasLoop, type CanvasPaint } from '../../hooks/useCanvasLoop';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type MotionStageProps = {
  title: string;
  leaveLabel: string;
  leaveTo?: string;
  hint: string;
  summary: string;
  bodyLockClass?: string;
  paint: CanvasPaint;
  onMount?: () => void;
  onUnmount?: () => void;
  onPointer: (x: number, y: number, active: boolean, strike: boolean) => void;
  modes: readonly { id: string; label: string; active: boolean; onClick: () => void }[];
  action: { label: string; onClick: () => void };
};

export default function MotionStage({
  title,
  leaveLabel,
  leaveTo = '/motion',
  hint,
  summary,
  bodyLockClass = 'motion-lock',
  paint,
  onMount,
  onUnmount,
  onPointer,
  modes,
  action,
}: MotionStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const onMountRef = useRef(onMount);
  const onUnmountRef = useRef(onUnmount);
  onMountRef.current = onMount;
  onUnmountRef.current = onUnmount;

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    document.body.classList.add(bodyLockClass);
    onMountRef.current?.();
    return () => {
      document.body.classList.remove(bodyLockClass);
      onUnmountRef.current?.();
    };
  }, [bodyLockClass]);

  useCanvasLoop(canvasRef, paint, reduced);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>, strike: boolean) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    onPointer(event.clientX - bounds.left, event.clientY - bounds.top, true, strike);
  }

  return (
    <div className="motion-stage">
      <canvas
        ref={canvasRef}
        className="motion-canvas"
        aria-hidden="true"
        onPointerDown={(event) => pointFromEvent(event, true)}
        onPointerMove={(event) => pointFromEvent(event, false)}
        onPointerLeave={() => onPointer(0, 0, false, false)}
      />
      <Link className="stage-leave motion-leave" to={leaveTo}>{leaveLabel}</Link>
      <div className="motion-controls">
        <p className="motion-hint">{hint}</p>
        <div className="motion-modes">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={mode.active ? 'active' : undefined}
              onClick={mode.onClick}
            >
              {mode.label}
            </button>
          ))}
          <button type="button" onClick={action.onClick}>{action.label}</button>
        </div>
      </div>
      <p className="sr-only">{summary}</p>
    </div>
  );
}
