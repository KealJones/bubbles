export const MAX_BUBBLES = 12;
export const MAX_SHAPES = 24;
export const MERGE_DISTANCE = 36;

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
}

export function createBubble(id: number, width: number, height: number, onScreen: boolean): BubbleModel {
  const radius = Math.min(48 + Math.random() * 53, width * 0.2);
  return {
    id,
    x: radius + Math.random() * Math.max(1, width - radius * 2),
    y: onScreen ? height * (0.3 + Math.random() * 0.38) : height - radius * 0.15,
    radius,
    vx: (Math.random() - 0.5) * 23,
    vy: -(14 + Math.random() * 14),
    age: 0,
    lifetime: 35 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
  };
}

export function getFilmShapes(bubbles: BubbleModel[]): FilmShape[] {
  const shapes: FilmShape[] = [];
  for (const bubble of bubbles) {
    const t = bubble.age * 1.7 + bubble.phase;
    const wobble = 0.015 + (bubble.merge ? 0.025 : 0);
    const sx = 1 + Math.sin(t) * 0.035;
    const sy = 1 - Math.sin(t) * 0.035;
    if (bubble.merge) {
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
          wobble,
          // Removing smoothing as the two lobes coincide prevents a size jump.
          blend: index === 0 ? MERGE_DISTANCE : MERGE_DISTANCE * (1 - eased),
        });
      });
    } else {
      shapes.push({ x: bubble.x, y: bubble.y, rx: bubble.radius * sx, ry: bubble.radius * sy,
        phase: bubble.phase, wobble, blend: MERGE_DISTANCE });
    }
  }
  return shapes;
}

export function advanceBubbles(
  bubbles: BubbleModel[], dt: number, width: number,
  onMerge?: (x: number, y: number) => void,
): BubbleModel[] {
  const next = bubbles.filter((b) => b.age < b.lifetime && b.y + b.radius > -20);
  for (const b of next) {
    b.age += dt;
    b.x += (b.vx + Math.sin(b.age * 0.75 + b.phase) * 6) * dt;
    b.y += b.vy * dt;
    const edge = Math.min(b.radius, width / 2);
    if (b.x < edge || b.x > width - edge) {
      b.vx = b.x < edge ? Math.abs(b.vx) : -Math.abs(b.vx);
      b.x = Math.max(edge, Math.min(width - edge, b.x));
    }
    if (b.merge) {
      b.merge.elapsed += dt;
      if (b.merge.elapsed >= b.merge.duration) b.merge = undefined;
    }
  }
  for (let i = 0; i < next.length; i++) {
    const a = next[i];
    if (a.merge) continue;
    for (let j = i + 1; j < next.length; j++) {
      const b = next[j];
      if (b.merge) continue;
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
