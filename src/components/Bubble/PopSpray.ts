import type { BubbleModel } from './BubblePhysics';

type Drop = { x: number; y: number; vx: number; vy: number; life: number; size: number };

/** Tiny droplets leave the moving tear, rather than exploding from the center. */
export class PopSpray {
  private drops: Drop[] = [];
  draw(canvas: HTMLCanvasElement, bubbles: BubbleModel[], dt: number, width: number, height: number) {
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const b of bubbles) {
      if (!b.pop || b.pop.elapsed > .38 || dt <= 0) continue;
      const radius = b.pop.reach * b.pop.elapsed / .38;
      for (let i = 0; i < Math.ceil(dt * 550); i++) {
        const angle = Math.random() * Math.PI * 2;
        const x = b.pop.x + Math.cos(angle) * radius, y = b.pop.y + Math.sin(angle) * radius;
        if (Math.hypot(x - b.x, y - b.y) > b.radius * 1.08) continue;
        const speed = 35 + Math.random() * 95;
        this.drops.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .25, size: .4 + Math.random() * .8 });
      }
    }
    this.drops = this.drops.filter(d => d.life > 0).slice(-1600);
    for (const d of this.drops) {
      d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += dt * 95;
      ctx.fillStyle = `rgba(205,231,229,${Math.max(0, Math.min(.65, d.life * 1.5))})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill();
    }
  }
}
