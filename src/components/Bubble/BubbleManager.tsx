import { useCallback, useEffect, useRef, useState } from 'react';
import { selectBigCount, selectExponentialCount } from 'src/mechanics/counter/counterSlice';
import { useAppSelector } from 'src/store/store';
import { NumberDisplay } from '../NumberDisplay/NumberDisplay';
import { Bubble } from './Bubble';
import { advanceBubbles, createBubble, getFilmShapes, MAX_BUBBLES, type BubbleModel } from './BubblePhysics';
import { SoapFilmRenderer } from './SoapFilmRenderer';
import styles from './Bubble.module.css';

type FluidWindow = Window & { bubbleFluidImpulse?: (x: number, y: number) => void };

export function BubbleManager({ maxBubbles = MAX_BUBBLES }: { maxBubbles?: number }) {
  const count = useAppSelector(selectBigCount);
  const previousCount = useRef(0n);
  const nextId = useRef(0);
  const bubbles = useRef<BubbleModel[]>([]);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const canvas = useRef<HTMLCanvasElement>(null);
  const fluidFrame = useRef<HTMLIFrameElement>(null);
  const fluidCanvas = useRef<HTMLCanvasElement | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  const [renderError, setRenderError] = useState(false);

  const register = useCallback((id: number, element: HTMLButtonElement | null) => {
    if (element) buttons.current.set(id, element);
    else buttons.current.delete(id);
  }, []);
  const pop = useCallback((id: number) => {
    bubbles.current = bubbles.current.filter((b) => b.id !== id);
    setIds(bubbles.current.map((b) => b.id));
  }, []);

  useEffect(() => {
    const delta = count - previousCount.current;
    previousCount.current = count;
    if (delta <= 0n) return;
    const limit = Math.max(0, Math.min(MAX_BUBBLES, maxBubbles) - bubbles.current.length);
    const amount = Number(delta > BigInt(limit) ? BigInt(limit) : delta);
    const onScreen = nextId.current === 0;
    for (let i = 0; i < amount; i++) {
      bubbles.current.push(createBubble(nextId.current++, window.innerWidth, window.innerHeight, onScreen));
    }
    if (amount) setIds(bubbles.current.map((b) => b.id));
  }, [count, maxBubbles]);

  useEffect(() => {
    if (!canvas.current) return;
    let renderer: SoapFilmRenderer;
    try {
      renderer = new SoapFilmRenderer(canvas.current);
    } catch (error) {
      console.error('Unable to render soap film', error);
      setRenderError(true);
      return;
    }
    let frameId = 0;
    let previous = 0;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 0;
      previous = now;
      if (document.hidden) return;
      const width = window.innerWidth, height = window.innerHeight;
      const before = bubbles.current.length;
      bubbles.current = advanceBubbles(bubbles.current, dt, width, (x, y) => {
        const source = fluidFrame.current?.contentWindow as FluidWindow | null;
        source?.bubbleFluidImpulse?.(x / width, 1 - y / height);
      });
      if (bubbles.current.length !== before) setIds(bubbles.current.map((b) => b.id));
      for (const b of bubbles.current) {
        const button = buttons.current.get(b.id);
        if (!button) continue;
        const lobes = b.merge?.lobes;
        const rx = lobes ? Math.max(b.radius, ...lobes.map((l) => Math.abs(l.x) + l.radius)) : b.radius;
        const ry = lobes ? Math.max(b.radius, ...lobes.map((l) => Math.abs(l.y) + l.radius)) : b.radius;
        button.style.transform = 'translate(' + (b.x - rx) + 'px,' + (b.y - ry) + 'px)';
        button.style.width = rx * 2 + 'px';
        button.style.height = ry * 2 + 'px';
      }
      const source = fluidCanvas.current;
      if (source) renderer.draw(source, getFilmShapes(bubbles.current), now / 1000, width, height);
    };
    frameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameId); renderer.destroy(); };
  }, []);

  return (
    <div className={styles.bubbles}>
      <iframe
        aria-hidden="true"
        className={styles.fluidSource}
        ref={fluidFrame}
        src={`${import.meta.env.BASE_URL}fluid-simulation/index.html`}
        tabIndex={-1}
        title="Bubble fluid simulation"
        onLoad={() => { fluidCanvas.current = fluidFrame.current?.contentDocument?.querySelector('canvas') ?? null; }}
      />
      <canvas aria-hidden="true" className={styles.film} ref={canvas} />
      <div className={styles.hitLayer}>
        {ids.map((id) => <Bubble id={id} key={id} register={register} onPopped={pop} />)}
      </div>
      {renderError && <p className={styles.error}>The bubble effect needs WebGL 2. Try opening this page in a current browser.</p>}
      <div className={styles.score}><NumberDisplay selector={selectExponentialCount} /> Bubbles</div>
    </div>
  );
}

export default BubbleManager;
