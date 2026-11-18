import { describe, expect, it } from 'vitest'
import { galaxies } from '../../src/catalog'
import { diskRadii, motionInfo, positionAt, spinAt, timeLimitMyr } from '../../src/motion'
import { placement } from '../../src/physics'

const galaxy = (id: string) => galaxies.find(entry => entry.id === id)!
const andromeda = galaxy('andromeda')

describe('short-term galaxy motion', () => {
  it('recovers the catalog centers at the present epoch and keeps the reference origin fixed', () => {
    for (const entry of galaxies) expect(positionAt(entry, 0)).toEqual(placement(entry).center)
    expect(positionAt(galaxy('milky-way'), timeLimitMyr)).toEqual([0, 0, 0])
  })

  it('moves Andromeda toward the Milky Way at its observed radial speed', () => {
    const present = Math.hypot(...positionAt(andromeda, 0))
    const later = Math.hypot(...positionAt(andromeda, 1))
    // About 110 km/s over 1 Myr, approximately 0.11 kpc closer.
    expect(present - later).toBeGreaterThan(0.10)
    expect(present - later).toBeLessThan(0.12)
  })

  it('applies relative separation to the entire path and reverses drift about today', () => {
    const lmc = galaxy('large-magellanic-cloud')
    const before = positionAt(lmc, -10)
    const now = positionAt(lmc, 0)
    const after = positionAt(lmc, 10)
    // HST-derived space speed is of order 320 km/s in the Galactic frame.
    const displacement = Math.hypot(...after.map((x, i) => x - now[i]))
    expect(displacement).toBeGreaterThan(3.0)
    expect(displacement).toBeLessThan(3.6)
    const scaled = positionAt(lmc, 10, 0.5)
    after.forEach((x, i) => {
      expect(x + before[i]).toBeCloseTo(2 * now[i], 9)
      expect(scaled[i]).toBeCloseTo(x / 2, 9)
    })
    expect(positionAt(lmc, 1e3)).toEqual(after)
  })

  it('keeps incomplete velocities distinct from measured zero motion', () => {
    const missing = galaxy('m32')
    expect(positionAt(missing, -10)).toEqual(placement(missing).center)
    expect(motionInfo(missing).translation).toContain('unavailable')
    expect(spinAt(missing, 10)).toBe(0)
    expect(positionAt(galaxy('fornax'), 10)).not.toEqual(placement(galaxy('fornax')).center)
  })

  it('uses the observed senses and the representative physical radii for disk rotation', () => {
    expect(spinAt(andromeda, 10)).toBeCloseTo(0.211, 3)
    expect(spinAt(galaxy('triangulum'), 10)).toBeLessThan(0)
    expect(spinAt(galaxy('milky-way'), -10)).toBeGreaterThan(0)
    expect(spinAt(galaxy('small-magellanic-cloud'), 10)).toBe(0)
    expect(diskRadii(andromeda).reference * andromeda.diameterKpc).toBeCloseTo(10)
  })
})
