import { describe, expect, it } from 'vitest';
import { advanceBubbles, getFilmShapes, attachToWand, releaseFromWand, type BubbleModel } from './BubblePhysics';

function bubble(id: number, x: number, radius: number): BubbleModel {
  return { id, x, y: 300, radius, vx: 0, vy: 0, age: 0, lifetime: 40, phase: 0, depth: 1, mergeDelay: 0 };
}

describe('soap bubble collisions', () => {
  it('conserves projected area and momentum when unequal bubbles join', () => {
    const a = bubble(1, 200, 60);
    const b = bubble(2, 300, 40);
    a.vx = 8;
    b.vx = -4;
    const merged = advanceBubbles([a, b], 0, 1000);
    expect(merged).toHaveLength(1);
    expect(merged[0].radius ** 2).toBeCloseTo(60 ** 2 + 40 ** 2);
    expect(merged[0].vx).toBeCloseTo((8 * 3600 - 4 * 1600) / 5200);
    expect(merged[0].x).toBeCloseTo((200 * 3600 + 300 * 1600) / 5200);
  });

  it('keeps two continuous lobes until the neck closes, then one settled surface', () => {
    let scene = advanceBubbles([bubble(1, 200, 60), bubble(2, 300, 40)], 0, 1000);
    const initial = getFilmShapes(scene);
    expect(initial).toHaveLength(2);
    expect(initial.map((s) => s.x)).toEqual([200, 300]);
    scene = advanceBubbles(scene, 0.7, 1000);
    const halfway = getFilmShapes(scene);
    expect(halfway).toHaveLength(2);
    expect(Math.abs(halfway[1].x - halfway[0].x)).toBeLessThan(100);
    scene = advanceBubbles(scene, 0.71, 1000);
    expect(getFilmShapes(scene)).toHaveLength(1);
  });

  it('stirs fluid once at contact and never merges distant bubbles', () => {
    let collisions = 0;
    let scene = [bubble(1, 200, 50), bubble(2, 500, 50)];
    scene = advanceBubbles(scene, 0, 1000, () => collisions++);
    expect(scene).toHaveLength(2);
    expect(collisions).toBe(0);
    scene[1].x = 300;
    scene = advanceBubbles(scene, 0, 1000, () => collisions++);
    advanceBubbles(scene, 0.3, 1000, () => collisions++);
    expect(collisions).toBe(1);
  });
});


describe('depth and blowing bubbles', () => {
  it('allows overlapping bubbles at different depths to pass through each other', () => {
    const a = bubble(1, 200, 60), b = bubble(2, 200, 60);
    b.depth = 2;
    const scene = advanceBubbles([a, b], 0.1, 1000);
    expect(scene).toHaveLength(2);
    expect(getFilmShapes(scene).map((s) => s.depth)).toEqual([1, 2]);
  });

  it('grows an attached bubble at the wand and releases it upward without merging at the tip', () => {
    const b = bubble(1, 200, 50);
    attachToWand(b, 400, 500);
    const initialRadius = b.radius;
    const scene = advanceBubbles([b], 1, 1000);
    expect(b.radius).toBeGreaterThan(initialRadius);
    expect(b.x).toBe(400);
    expect(b.y + b.radius * 0.78).toBeGreaterThan(500);
    expect(getFilmShapes(scene)).toHaveLength(2);
    releaseFromWand(b);
    expect(b.anchor).toBeUndefined();
    expect(b.vy).toBeLessThan(0);
    expect(b.mergeDelay).toBeGreaterThan(0);
    expect(getFilmShapes(scene)).toHaveLength(1);
  });
});
