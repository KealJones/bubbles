import { useCallback, useEffect, useRef, useState } from 'react';
import { increment, selectBigCount, selectExponentialCount } from 'src/mechanics/counter/counterSlice';
import { useAppDispatch, useAppSelector } from 'src/store/store';
import { BubbleWand } from 'src/mechanics/bubbleWand/BubbleWand';
import { NumberDisplay } from '../NumberDisplay/NumberDisplay';
import { Bubble } from './Bubble';
import { popBubble, advanceBubbles, attachToWand, releaseFromWand, createBubble, getFilmShapes, MAX_BUBBLES, type BubbleModel } from './BubblePhysics';
import { PopSpray } from './PopSpray';
import { SoapFilmRenderer } from './SoapFilmRenderer';
import styles from './Bubble.module.css';

type FluidWindow = Window & {
  bubbleFluidImpulse?: (x: number, y: number) => void;
  bubbleFluidSetSpeed?: (speed: number) => void;
};

export function BubbleManager({ maxBubbles = MAX_BUBBLES }: { maxBubbles?: number }) {
  const count = useAppSelector(selectBigCount);
  const dispatch = useAppDispatch();
  const previousCount = useRef(0n);
  const countedByWand = useRef(0n);
  const nextId = useRef(0);
  const growingId = useRef<number | null>(null);
  const bubbles = useRef<BubbleModel[]>([]);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const sprayCanvas = useRef<HTMLCanvasElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fluidFrame = useRef<HTMLIFrameElement>(null);
  const fluidCanvas = useRef<HTMLCanvasElement | null>(null);
  const [blowing, setBlowing] = useState(false);
  const [ids, setIds] = useState<number[]>([]);
  const [renderError, setRenderError] = useState(false);
  const [flowSpeed, setFlowSpeed] = useState(0.25);
  const [transparency, setTransparency] = useState(0.8);
  const [lightBending, setLightBending] = useState(1);
  const [backdrop, setBackdrop] = useState('black');
  const material = useRef({ flowSpeed, transparency, backdrop, lightBending });
  const capacity = Math.max(0, Math.min(MAX_BUBBLES, maxBubbles));

  useEffect(() => {
    material.current = { flowSpeed, transparency, backdrop, lightBending };
    (fluidFrame.current?.contentWindow as FluidWindow | null)?.bubbleFluidSetSpeed?.(flowSpeed);
  }, [flowSpeed, transparency, backdrop, lightBending]);

  const register = useCallback((id: number, element: HTMLButtonElement | null) => {
    if (element) buttons.current.set(id, element);
    else buttons.current.delete(id);
  }, []);
  const pop = useCallback((id: number, x?: number, y?: number) => {
    const bubble = bubbles.current.find(b => b.id === id);
    if (bubble && !bubble.anchor) popBubble(bubble, x, y);
  }, []);

  const startBlowing = useCallback((x: number, y: number) => {
    if (!capacity || growingId.current !== null) return false;
    if (bubbles.current.length >= capacity) bubbles.current.shift();
    const bubble = createBubble(nextId.current++, window.innerWidth, window.innerHeight, false);
    attachToWand(bubble, x, y);
    bubbles.current.push(bubble);
    growingId.current = bubble.id;
    setBlowing(true);
    setIds(bubbles.current.map((b) => b.id));
    return true;
  }, [capacity]);
  const releaseBubble = useCallback((vx: number, vy: number) => {
    const bubble = bubbles.current.find((b) => b.id === growingId.current);
    if (!bubble?.anchor) return;
    releaseFromWand(bubble, vx, vy);
    growingId.current = null;
    setBlowing(false);
    countedByWand.current += 1n;
    dispatch(increment());
  }, [dispatch]);
  const moveWand = useCallback((x: number, y: number, vx: number, vy: number) => {
    const bubble = bubbles.current.find(b => b.id === growingId.current);
    if (!bubble?.anchor) return;
    bubble.anchor = { x, y };
    if (bubble.age > .35 && bubble.radius > 25 && Math.hypot(vx, vy) > 950) releaseBubble(vx, vy);
  }, [releaseBubble]);
  const cancelBlowing = useCallback(() => {
    if (growingId.current === null) return;
    bubbles.current = bubbles.current.filter((b) => b.id !== growingId.current);
    growingId.current = null;
    setBlowing(false);
    setIds(bubbles.current.map((b) => b.id));
  }, []);

  useEffect(() => {
    let delta = count - previousCount.current;
    previousCount.current = count;
    if (delta <= 0n) return;
    // A released wand bubble already exists. Only machine/devtool increments spawn here.
    const alreadyCreated = delta < countedByWand.current ? delta : countedByWand.current;
    countedByWand.current -= alreadyCreated;
    delta -= alreadyCreated;
    const limit = Math.max(0, capacity - bubbles.current.length);
    const amount = Number(delta > BigInt(limit) ? BigInt(limit) : delta);
    const onScreen = nextId.current === 0;
    for (let i = 0; i < amount; i++) {
      bubbles.current.push(createBubble(nextId.current++, window.innerWidth, window.innerHeight, onScreen));
    }
    if (amount) setIds(bubbles.current.map((b) => b.id));
  }, [count, capacity]);

  useEffect(() => {
    if (!canvas.current) return;
    let renderer: SoapFilmRenderer;
    try { renderer = new SoapFilmRenderer(canvas.current); }
    catch (error) {
      console.error('Unable to render soap film', error);
      setRenderError(true);
      return;
    }
    const spray = new PopSpray();
    let frameId = 0, previous = 0, filmTime = 0;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 0;
      previous = now;
      if (document.hidden) return;
      filmTime += dt * material.current.flowSpeed;
      const width = window.innerWidth, height = window.innerHeight;
      const before = bubbles.current.length;
      bubbles.current = advanceBubbles(bubbles.current, dt, width, (x, y) => {
        const source = fluidFrame.current?.contentWindow as FluidWindow | null;
        source?.bubbleFluidImpulse?.(x / width, 1 - y / height);
      });
      if (growingId.current !== null && !bubbles.current.find(b => b.id === growingId.current)?.anchor) {
        growingId.current = null;
        setBlowing(false);
      }
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
        button.style.zIndex = String(b.depth + 1);
        button.style.pointerEvents = b.anchor || b.pop ? 'none' : 'auto';
      }
      if (sprayCanvas.current) spray.draw(sprayCanvas.current, bubbles.current, dt, width, height);
      const source = fluidCanvas.current;
      if (source) renderer.draw(source, getFilmShapes(bubbles.current), filmTime, width, height, material.current.transparency, material.current.backdrop, material.current.lightBending);
    };
    frameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameId); renderer.destroy(); };
  }, []);

  return (
    <div className={styles.bubbles} data-bubble-stage data-backdrop={backdrop}>
      <iframe
        aria-hidden="true" className={styles.fluidSource} ref={fluidFrame}
        src={`${import.meta.env.BASE_URL}fluid-simulation/index.html`}
        tabIndex={-1} title="Bubble fluid simulation"
        onLoad={() => {
          fluidCanvas.current = fluidFrame.current?.contentDocument?.querySelector('canvas') ?? null;
          (fluidFrame.current?.contentWindow as FluidWindow | null)?.bubbleFluidSetSpeed?.(material.current.flowSpeed);
        }}
      />
      <canvas aria-hidden="true" className={styles.film} ref={canvas} />
      <canvas aria-hidden="true" className={styles.spray} ref={sprayCanvas} />
      <div className={styles.hitLayer}>
        {ids.map((id) => <Bubble id={id} key={id} register={register} onPopped={pop} />)}
      </div>
      <BubbleWand blowing={blowing} onStart={startBlowing} onMove={moveWand} onRelease={releaseBubble} onCancel={cancelBlowing} />
      <details className={styles.settings} data-wand-ui>
        <summary>Motion &amp; glass</summary>
        <div className={styles.settingsBody}>
          <label htmlFor="bubble-flow">Flow speed <output>{Math.round(flowSpeed * 100)}%</output></label>
          <input id="bubble-flow" type="range" min="0.05" max="1" step="0.05" value={flowSpeed} onChange={(e) => setFlowSpeed(Number(e.target.value))} />
          <label htmlFor="bubble-transparency">Transparency <output>{Math.round(transparency * 100)}%</output></label>
          <input id="bubble-transparency" type="range" min="0" max="1" step="0.05" value={transparency} onChange={(e) => setTransparency(Number(e.target.value))} />
          <label htmlFor="bubble-bending">Light bending <output>{Math.round(lightBending * 100)}%</output></label>
          <input id="bubble-bending" type="range" min="0" max="3" step="0.05" value={lightBending} onChange={(e) => setLightBending(Number(e.target.value))} />
          <label htmlFor="bubble-backdrop">Background</label>
          <select id="bubble-backdrop" value={backdrop} onChange={(e) => setBackdrop(e.target.value)}>
            <option value="black">Black</option><option value="grid">Grid</option>
          </select>
          <p>Pick up the wand, dip it in the juice, then hold to blow. Release or sweep quickly to let it float. Different depths drift past each other.</p>
        </div>
      </details>
      {renderError && <p className={styles.error}>The bubble effect needs WebGL 2. Try opening this page in a current browser.</p>}
      <div className={styles.score}><NumberDisplay selector={selectExponentialCount} /> Bubbles</div>
    </div>
  );
}

export default BubbleManager;
