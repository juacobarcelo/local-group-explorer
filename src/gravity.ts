import { galaxies } from './catalog'
import { centerVelocityKpcPerMyr } from './motion'
import { placement, type Coordinates } from './physics'

export const gravityTimeLimitMyr = 500
const stepMyr = 0.5
// kpc³ / (solar mass × Myr²), from the IAU nominal solar mass parameter.
const gravitationalConstant = 4.49850e-12

// Each extended mass has one halo component and one compact baryonic component.
// See docs/gravity.md for the mass budgets and the calibration of these radii.
export const gravityBodies = [
  { id: 'milky-way', haloMassSolar: 8e11, haloScaleKpc: 50, baryonMassSolar: 7.3e10, baryonScaleKpc: 3 },
  { id: 'large-magellanic-cloud', haloMassSolar: 1.5e11, haloScaleKpc: 17, baryonMassSolar: 2e9, baryonScaleKpc: 1.5 },
  { id: 'small-magellanic-cloud', haloMassSolar: 2e10, haloScaleKpc: 5.7, baryonMassSolar: 5.2e8, baryonScaleKpc: 1 },
]

type State = { position: Coordinates; velocity: Coordinates }[]
const totalMass = gravityBodies.map(body => body.haloMassSolar + body.baryonMassSolar)
const pairs = gravityBodies.flatMap((a, i) => gravityBodies.slice(i + 1).map((b, offset) => {
  const j = i + 1 + offset
  const parts = (body: typeof a) => [
    { mass: body.haloMassSolar, scale: body.haloScaleKpc },
    { mass: body.baryonMassSolar, scale: body.baryonScaleKpc },
  ]
  const terms = parts(a).flatMap(p => parts(b).map(q => ({
    strength: gravitationalConstant * p.mass * q.mass,
    softeningSquared: p.scale ** 2 + q.scale ** 2,
  })))
  return { i, j, terms }
}))

function initialState(): State {
  return gravityBodies.map(body => {
    const galaxy = galaxies.find(entry => entry.id === body.id)!
    return { position: placement(galaxy).center, velocity: centerVelocityKpcPerMyr(galaxy)! }
  })
}

function accelerations(state: State): Coordinates[] {
  const result = state.map((): Coordinates => [0, 0, 0])
  for (const { i, j, terms } of pairs) {
    const delta = state[j].position.map((x, axis) => x - state[i].position[axis])
    const distanceSquared = delta.reduce((sum, x) => sum + x * x, 0)
    const forceFactor = terms.reduce((sum, term) =>
      sum + term.strength / (distanceSquared + term.softeningSquared) ** 1.5, 0)
    for (let axis = 0; axis < 3; axis++) {
      const force = delta[axis] * forceFactor
      result[i][axis] += force / totalMass[i]
      result[j][axis] -= force / totalMass[j]
    }
  }
  return result
}

// Velocity Verlet, with positions advanced together before recomputing the forces.
export function advanceGravity(state: State, dtMyr: number): State {
  const first = accelerations(state)
  const next = state.map(({ position, velocity }, i) => {
    const halfVelocity = velocity.map((v, axis) => v + first[i][axis] * dtMyr / 2) as Coordinates
    return {
      position: position.map((x, axis) => x + halfVelocity[axis] * dtMyr) as Coordinates,
      velocity: halfVelocity,
    }
  })
  const last = accelerations(next)
  next.forEach((body, i) => {
    for (let axis = 0; axis < 3; axis++) body.velocity[axis] += last[i][axis] * dtMyr / 2
  })
  return next
}

export const gravityEpoch = initialState()
const tracks: [State[], State[]] = [[gravityEpoch], [gravityEpoch]]
const bodyIndex = new Map(gravityBodies.map((body, i) => [body.id, i]))

function indexOfBody(id: string): number {
  const index = bodyIndex.get(id)
  if (index === undefined) throw new RangeError('No gravity trajectory for ' + id)
  return index
}

function limitedTime(timeMyr: number) {
  return Math.max(-gravityTimeLimitMyr, Math.min(gravityTimeLimitMyr, timeMyr))
}

export function straightPositionAt(id: string, timeMyr: number, separation = 1): Coordinates {
  const body = gravityEpoch[indexOfBody(id)]
  const t = limitedTime(timeMyr)
  return body.position.map((x, axis) => (x + body.velocity[axis] * t) * separation) as Coordinates
}

export function gravityPositionAt(id: string, timeMyr: number, separation = 1): Coordinates {
  const i = indexOfBody(id)
  const t = limitedTime(timeMyr)
  const track = tracks[t < 0 ? 0 : 1]
  const step = Math.abs(t) / stepMyr
  const upper = Math.ceil(step)
  while (track.length <= upper) {
    track.push(advanceGravity(track[track.length - 1], Math.sign(t) * stepMyr))
  }
  const lower = Math.floor(step)
  const weight = step - lower
  const a = track[lower], b = track[upper]
  return a[i].position.map((x, axis) => {
    const from = x - a[0].position[axis]
    const to = b[i].position[axis] - b[0].position[axis]
    return (from + (to - from) * weight) * separation
  }) as Coordinates
}
