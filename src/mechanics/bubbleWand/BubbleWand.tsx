import { useEffect, useId, useRef, useState } from 'react';
import styles from './BubbleWand.module.css';

type Props = {
  blowing: boolean;
  onStart: (x: number, y: number) => boolean;
  onMove: (x: number, y: number, vx: number, vy: number) => void;
  onRelease: (vx: number, vy: number) => void;
  onCancel: () => void;
  onReadyFilm: (point: { x: number; y: number } | null) => void;
};
function Wand() {
  const id = useId();
  return (
    <svg viewBox="0 0 60 130" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-paint`} gradientUnits="userSpaceOnUse" x1="6" y1="6" x2="52" y2="120">
          <stop stopColor="#b6f9e4"/><stop offset="1" stopColor="#b4a3ee"/>
        </linearGradient>
      </defs>
      <path d="M30 53L30 114" stroke={`url(#${id}-paint)`} strokeWidth="9" strokeLinecap="round"/>
      <circle cx="30" cy="29" r="23" fill="none" stroke={`url(#${id}-paint)`} strokeWidth="5"/>
      <circle cx="30" cy="29" r="18" fill="none" stroke="#e6fffa" strokeOpacity=".5"/>
      <path d="m30 91 3 5 6 1-4 4 1 6-6-3-5 3 1-6-5-4 6-1Z" fill="#fff2ba"/>
    </svg>
  );
}
export function BubbleWand({ blowing, onStart, onMove, onRelease, onCancel, onReadyFilm }: Props) {
  const [equipped, setEquipped] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const cursor = useRef<HTMLDivElement>(null);
  const juice = useRef<HTMLButtonElement>(null);
  const active = useRef(false);
  const pointer = useRef<number | null>(null);
  const point = useRef({ x: 0, y: 0, time: 0, vx: 0, vy: 0 });
  const dipped = useRef(false);
  const position = (x: number, y: number, visible = true) => {
    if (!cursor.current) return;
    cursor.current.style.transform = `translate3d(${x - 25}px,${y - 24}px,0) rotate(-12deg)`;
    cursor.current.style.opacity = visible ? '1' : '0';
    onReadyFilm(loaded && visible ? { x, y } : null);
  };
  useEffect(() => {
    if (equipped && point.current.time) position(point.current.x, point.current.y);
    else onReadyFilm(null);
  }, [equipped, loaded, onReadyFilm]);
  useEffect(() => {
    if (!blowing) { active.current = false; pointer.current = null; }
  }, [blowing]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!equipped || (pointer.current !== null && event.pointerId !== pointer.current)) return;
      const target = event.target instanceof Element ? event.target : null;
      const now = performance.now(), dt = Math.max(16, now - point.current.time) / 1000;
      const vx = (event.clientX - point.current.x) / dt, vy = (event.clientY - point.current.y) / dt;
      point.current = { x: event.clientX, y: event.clientY, time: now, vx, vy };
      position(event.clientX, event.clientY, active.current || !target?.closest('button:not([data-juice]), input, select, summary'));
      const rect = juice.current?.getBoundingClientRect();
      const inside = !!rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside && !dipped.current && !active.current) setLoaded(true);
      dipped.current = inside;
      if (active.current) { event.preventDefault(); onMove(event.clientX, event.clientY, vx, vy); }
    };
    const down = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!equipped || !loaded || active.current || event.button !== 0 || !target?.closest('[data-bubble-stage]') || target.closest('button, input, select, summary, [data-wand-ui]')) return;
      event.preventDefault();
      if (!onStart(event.clientX, event.clientY)) return;
      setLoaded(false); active.current = true; pointer.current = event.pointerId;
      point.current = { x: event.clientX, y: event.clientY, time: performance.now(), vx: 0, vy: 0 };
      position(event.clientX, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (!active.current || pointer.current !== event.pointerId) return;
      const moving = performance.now() - point.current.time < 120;
      onRelease(moving ? point.current.vx : 0, moving ? point.current.vy : 0);
      active.current = false; pointer.current = null;
    };
    const cancel = () => { if (active.current) onCancel(); active.current = false; pointer.current = null; };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { cancel(); setEquipped(false); } };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key);
    };
  }, [equipped, loaded, onStart, onMove, onRelease, onCancel, onReadyFilm]);
  return <>
    {equipped && <div className={styles.cursor} ref={cursor} data-loaded={loaded} data-blowing={blowing} aria-hidden="true"><Wand /></div>}
    <div className={styles.station} data-wand-ui>
      <button ref={juice} data-juice className={styles.juice} disabled={!equipped || blowing} onClick={() => setLoaded(true)} aria-label="Dip wand in bubble juice"><span className={styles.liquid}><i/><i/><i/></span><span>bubble juice</span></button>
      <button className={styles.pickup} aria-pressed={equipped} onClick={() => { if (blowing) onRelease(0, 0); setEquipped(!equipped); }}><Wand /><span>{equipped ? 'Put down wand' : 'Pick up wand'}</span></button>
    </div>
    <div className={styles.hint} aria-live="polite">{!equipped ? 'Click a bubble to pop it' : blowing ? 'Keep blowing… or sweep to release' : loaded ? 'Hold anywhere to blow · release to let go' : 'Dip your wand in the bubble juice'}
      {equipped && <button disabled={!loaded && !blowing} onPointerDown={event => {
        if (!loaded || !onStart(window.innerWidth / 2, window.innerHeight * .65)) return;
        event.currentTarget.setPointerCapture(event.pointerId); active.current = true; pointer.current = event.pointerId; setLoaded(false);
      }} onKeyDown={event => {
        if (![' ', 'Enter'].includes(event.key) || event.repeat || !loaded) return;
        event.preventDefault(); if (onStart(window.innerWidth / 2, window.innerHeight * .65)) { setLoaded(false); active.current = true; pointer.current = -1; }
      }} onKeyUp={event => { if ([' ', 'Enter'].includes(event.key) && pointer.current === -1) { event.preventDefault(); onRelease(0, 0); active.current = false; pointer.current = null; } }}>Hold to blow</button>}
    </div>
  </>;
}
