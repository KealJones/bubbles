export const MAX_BUBBLES = 18;
export const MAX_SHAPES = 36;
export const MERGE_DISTANCE = 36;
export const DEPTH_SCALE = [0.64, 0.82, 1] as const;

export interface Lobe {
  x: number;
  y: number;
  radius: number;
}

export interface BubbleModel {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  phase: number;
  depth: number;
  mergeDelay: number;
  burstRadius?: number;
  pop?: { x: number; y: number; elapsed: number; reach: number };
  anchor?: { x: number; y: number };
  merge?: { elapsed: number; duration: number; lobes: [Lobe, Lobe] };
}

export interface FilmShape {
  x: number;
  y: number;
  rx: number;
  ry: number;
  phase: number;
  wobble: number;
  blend: number;
  depth: number;
  tear?: { x: number; y: number; radius: number };
}

export function createBubble(id: number, width: number, height: number, onScreen: boolean): BubbleModel {
  const depth = id % DEPTH_SCALE.length;
  const radius = Math.min((48 + Math.random() * 53) * DEPTH_SCALE[depth], width * 0.2);
  return {
    id,
    x: radius + Math.random() * Math.max(1, width - radius * 2),
    y: onScreen ? height * (0.3 + Math.random() * 0.38) : height - radius * 0.15,
    radius,
    vx: (Math.random() - 0.5) * 23,
    vy: -(10 + depth * 5 + Math.random() * 8),
    age: 0,
    lifetime: 35 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    depth,
    mergeDelay: 0,
  };
}

export function attachToWand(bubble: BubbleModel, x: number, y: number) {
  bubble.anchor = { x, y };
  bubble.burstRadius = (240 + Math.random() * 280) * DEPTH_SCALE[bubble.depth];
  bubble.radius = 12 * DEPTH_SCALE[bubble.depth];
  bubble.x = x;
  bubble.y = y - bubble.radius * 0.78;
  bubble.age = 0;
}

export function releaseFromWand(bubble: BubbleModel, vx = 0, vy = 0) {
  if (!bubble.anchor) return;
  bubble.radius = Math.max(bubble.radius, 32 * DEPTH_SCALE[bubble.depth]);
  bubble.anchor = undefined;
  bubble.age = 0;
  bubble.vx = Math.max(-85, Math.min(85, vx * 0.18));
  bubble.vy = -(48 + bubble.depth * 16) + Math.max(-30, Math.min(15, vy * 0.10));
  bubble.mergeDelay = 0.9;
}

export function popBubble(bubble: BubbleModel, x = bubble.x, y = bubble.y) {
  if (bubble.pop) return;
  const extent = bubble.merge ? Math.max(bubble.radius, ...bubble.merge.lobes.map(l => Math.hypot(l.x, l.y) + l.radius)) : bubble.radius;
  bubble.pop = { x, y, elapsed: 0, reach: (Math.hypot(x - bubble.x, y - bubble.y) + extent) * 1.2 };
  bubble.anchor = undefined;
}

export function getFilmShapes(bubbles: BubbleModel[]): FilmShape[] {
  const shapes: FilmShape[] = [];
  for (const bubble of bubbles) {
    const t = bubble.age * 1.7 + bubble.phase;
    const wobble = 0.015 + Math.min(.095, Math.max(0, bubble.radius - 55) * .00035) + (bubble.merge ? 0.025 : 0);
    const start = shapes.length;
    const sx = 1 + Math.sin(t) * 0.035;
    const sy = 1 - Math.sin(t) * 0.035;
    if (bubble.anchor) {
      shapes.push({ x: bubble.x, y: bubble.y, rx: bubble.radius * sx, ry: bubble.radius * sy,
        phase: bubble.phase, wobble, blend: 22, depth: bubble.depth });
      shapes.push({ x: bubble.anchor.x, y: bubble.anchor.y, rx: 11, ry: 9,
        phase: bubble.phase, wobble, blend: 22, depth: bubble.depth });
    } else if (bubble.merge) {
      const progress = Math.min(1, bubble.merge.elapsed / bubble.merge.duration);
      const eased = progress * progress * (3 - 2 * progress);
      bubble.merge.lobes.forEach((lobe, index) => {
        const r = lobe.radius + (bubble.radius - lobe.radius) * eased;
        shapes.push({
          x: bubble.x + lobe.x * (1 - eased),
          y: bubble.y + lobe.y * (1 - eased),
          rx: r * sx,
          ry: r * sy,
          phase: bubble.phase,
          depth: bubble.depth,
          wobble,
          // Removing smoothing as the two lobes coincide prevents a size jump.
          blend: index === 0 ? MERGE_DISTANCE : MERGE_DISTANCE * (1 - eased),
        });
      });
    } else {
      shapes.push({ x: bubble.x, y: bubble.y, rx: bubble.radius * sx, ry: bubble.radius * sy,
        phase: bubble.phase, wobble, blend: bubble.age < bubble.mergeDelay ? 0 : MERGE_DISTANCE, depth: bubble.depth });
    }
    if (bubble.pop) for (let i = start; i < shapes.length; i++) {
      shapes[i].blend = 0;
      shapes[i].tear = { x: bubble.pop.x, y: bubble.pop.y, radius: bubble.pop.reach * Math.min(1, bubble.pop.elapsed / .38) };
    }
  }
  return shapes;
}

export function advanceBubbles(
  bubbles: BubbleModel[], dt: number, width: number,
  onMerge?: (x: number, y: number) => void,
): BubbleModel[] {
  const next = bubbles.filter((b) => b.pop ? b.pop.elapsed < .42 : b.anchor || (b.age < b.lifetime && b.y + b.radius > -20));
  for (const b of next) {
    b.age += dt;
    if (b.pop) b.pop.elapsed += dt;
    if (b.anchor) {
      b.radius = (12 + 48 * Math.pow(b.age, .88)) * DEPTH_SCALE[b.depth];
      const follow = 1 - Math.exp(-dt * Math.max(2.5, 9 - b.radius / 55));
      b.x += (b.anchor.x - b.x) * follow;
      b.y += (b.anchor.y - b.radius * .78 - b.y) * follow;
      if (b.radius > (b.burstRadius ?? Infinity)) popBubble(b, b.x + b.radius * .7, b.y + b.radius * .3);
      continue;
    }
    if (b.mergeDelay > 0) b.vy += (-(12 + b.depth * 5) - b.vy) * Math.min(1, dt * .7);
    const previousX = b.x, previousY = b.y;
    b.x += (b.vx + Math.sin(b.age * 0.75 + b.phase) * 6) * dt;
    b.y += b.vy * dt;
    const edge = Math.min(b.radius, width / 2);
    if (b.x < edge || b.x > width - edge) {
      b.vx = b.x < edge ? Math.abs(b.vx) : -Math.abs(b.vx);
      b.x = Math.max(edge, Math.min(width - edge, b.x));
    }
    // Carry the opening tear with the moving film.
    if (b.pop) { b.pop.x += b.x - previousX; b.pop.y += b.y - previousY; }
    if (b.merge) {
      b.merge.elapsed += dt;
      if (b.merge.elapsed >= b.merge.duration) b.merge = undefined;
    }
  }
  for (let i = 0; i < next.length; i++) {
    const a = next[i];
    if (a.pop || a.merge || a.anchor || a.age < a.mergeDelay) continue;
    for (let j = i + 1; j < next.length; j++) {
      const b = next[j];
      if (b.pop || b.merge || b.anchor || b.age < b.mergeDelay || b.depth !== a.depth) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const gap = distance - a.radius - b.radius;
      if (gap > MERGE_DISTANCE) continue;
      // Surface tension pulls nearby films toward the forming neck.
      if (gap > 3) {
        const force = (1 - gap / MERGE_DISTANCE) * dt * 32 / Math.max(1, distance);
        a.vx += dx * force; a.vy += dy * force;
        b.vx -= dx * force; b.vy -= dy * force;
        continue;
      }
      const areaA = a.radius * a.radius, areaB = b.radius * b.radius;
      const area = areaA + areaB;
      const x = (a.x * areaA + b.x * areaB) / area;
      const y = (a.y * areaA + b.y * areaB) / area;
      const lobes: [Lobe, Lobe] = [
        { x: a.x - x, y: a.y - y, radius: a.radius },
        { x: b.x - x, y: b.y - y, radius: b.radius },
      ];
      a.vx = (a.vx * areaA + b.vx * areaB) / area;
      a.vy = (a.vy * areaA + b.vy * areaB) / area;
      a.lifetime = Math.max(a.lifetime - a.age, b.lifetime - b.age) + 6;
      a.age = 0;
      a.x = x; a.y = y; a.radius = Math.sqrt(area);
      a.merge = { elapsed: 0, duration: 1.4, lobes };
      next.splice(j, 1);
      onMerge?.(x, y);
      break;
    }
  }
  return next;
}
