import { describe, expect, it } from 'vitest'
import { advanceGravity, gravityBodies, gravityEpoch, gravityTimeLimitMyr, gravityPositionAt, straightPositionAt } from '../../src/gravity'
import { galaxies } from '../../src/catalog'
import { positionAt } from '../../src/motion'

type State = typeof gravityEpoch
const mass = gravityBodies.map(body => body.haloMassSolar + body.baryonMassSolar)
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((x, i) => x - b[i]))

function energy(state: State) {
  let total = state.reduce((sum, b, i) => sum + 0.5 * mass[i] * Math.hypot(...b.velocity) ** 2, 0)
  for (let i = 0; i < state.length; i++) {
    const a = gravityBodies[i]
    for (let j = i + 1; j < state.length; j++) {
      const b = gravityBodies[j]
      const r = distance(state[i].position, state[j].position)
      for (const [ma, sa] of [[a.haloMassSolar, a.haloScaleKpc], [a.baryonMassSolar, a.baryonScaleKpc]])
        for (const [mb, sb] of [[b.haloMassSolar, b.haloScaleKpc], [b.baryonMassSolar, b.baryonScaleKpc]])
          total -= 4.49850e-12 * ma * mb / Math.hypot(r, sa, sb)
    }
  }
  return total
}

function integrate(state: State, dt: number, steps: number): State {
  for (let i = 0; i < steps; i++) state = advanceGravity(state, dt)
  return state
}

describe('mutual Local Group gravity', () => {
  it('shares the catalog epoch and the constant-velocity initial conditions', () => {
    for (const body of gravityBodies) {
      const galaxy = galaxies.find(g => g.id === body.id)!
      expect(gravityPositionAt(body.id, 0)).toEqual(positionAt(galaxy, 0))
      expect(straightPositionAt(body.id, 10)).toEqual(positionAt(galaxy, 10))
    }
  })

  it('accelerates the Milky Way, preserves momentum, and displays relative positions', () => {
    const state = integrate(gravityEpoch, 0.5, 200)
    expect(Math.hypot(...state[0].position)).toBeGreaterThan(0.2)
    for (let axis = 0; axis < 3; axis++) {
      const momentumChange = state.reduce((sum, body, i) =>
        sum + mass[i] * (body.velocity[axis] - gravityEpoch[i].velocity[axis]), 0)
      expect(Math.abs(momentumChange)).toBeLessThan(0.001)
    }
    expect(gravityPositionAt('milky-way', 100)).toEqual([0, 0, 0])
    const lmc = gravityPositionAt('large-magellanic-cloud', 100)
    expect(distance(lmc, straightPositionAt('large-magellanic-cloud', 100))).toBeGreaterThan(1)
    expect(gravityPositionAt('large-magellanic-cloud', 100, 2)).toEqual(lmc.map(x => x * 2))
  })

  it('moves M31 relative to the Milky Way and M33 relative to M31', () => {
    const separation = (a: string, b: string, t: number) => distance(gravityPositionAt(a, t), gravityPositionAt(b, t))
    for (const pair of [['andromeda', 'milky-way'], ['triangulum', 'andromeda']]) {
      const initial = separation(pair[0], pair[1], 0)
      expect(Math.abs(separation(pair[0], pair[1], gravityTimeLimitMyr) - initial)).toBeGreaterThan(10)
      expect(distance(gravityPositionAt(pair[0], gravityTimeLimitMyr), straightPositionAt(pair[0], gravityTimeLimitMyr))).toBeGreaterThan(10)
    }
  })

  it.each([-gravityTimeLimitMyr, gravityTimeLimitMyr])('converges, conserves energy and reverses over %i Myr', horizon => {
    const dt = 0.5 * Math.sign(horizon)
    const steps = Math.abs(horizon / dt)
    const state = integrate(gravityEpoch, dt, steps)
    const finer = integrate(gravityEpoch, dt / 2, steps * 2)
    const reversed = integrate(state, -dt, steps)
    expect(Math.abs(energy(state) / energy(gravityEpoch) - 1)).toBeLessThan(0.0001)
    for (let i = 0; i < state.length; i++) {
      expect(distance(state[i].position, finer[i].position)).toBeLessThan(0.005)
      expect(distance(reversed[i].position, gravityEpoch[i].position)).toBeLessThan(1e-8)
    }
  })
})
