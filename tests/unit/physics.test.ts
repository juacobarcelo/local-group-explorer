import { describe, expect, it } from 'vitest';
import { galaxies } from '../../src/catalog';
import { placement } from '../../src/physics';

const milkyWay = galaxies.find(galaxy => galaxy.id === 'milky-way')!;
const andromeda = galaxies.find(galaxy => galaxy.id === 'andromeda')!;

describe('physical scale', () => {
  it('preserves a known 5:1 center separation to diameter ratio at true scale', () => {
    // Same sightline, with 10 kpc between centers and 2 kpc optical diameters.
    const near = { ...andromeda, raDeg: 0, decDeg: 0, distanceKpc: 10, diameterKpc: 2 };
    const far = { ...near, distanceKpc: 20 };
    const first = placement(near, 1, 1);
    const second = placement(far, 1, 1);
    const separation = Math.hypot(...second.center.map((value, i) => value - first.center[i]));
    expect(first.diameter).toBe(2);
    expect(separation).toBeCloseTo(10);
    expect(separation / first.diameter).toBeCloseTo(5);
    expect(placement(milkyWay, 1, 1).center).toEqual([0, 0, 0]);
  });

  it('doubles every diameter while preserving all centers', () => {
    for (const galaxy of galaxies) {
      const original = placement(galaxy, 1, 1);
      const larger = placement(galaxy, 2, 1);
      expect(larger.diameter).toBeCloseTo(galaxy.diameterKpc * 2);
      expect(larger.center).toEqual(original.center);
    }
  });

  it('halves center offsets from the Milky Way and preserves optical diameters', () => {
    for (const galaxy of galaxies) {
      const original = placement(galaxy, 1, 1);
      const compressed = placement(galaxy, 1, 0.5);
      compressed.center.forEach((value, i) => expect(value).toBeCloseTo(original.center[i] / 2));
      expect(compressed.diameter).toBe(galaxy.diameterKpc);
    }
  });
});
