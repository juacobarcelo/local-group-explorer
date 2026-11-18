import { expect, it } from 'vitest'
import { MathUtils, Vector3 } from 'three'
import { galaxies } from '../../src/catalog'
import { createGalaxyModel } from '../../src/models'
import { observerDirection, skyDirection } from '../../src/physics'

it.each([
  ['andromeda', 38, 77, 308],
  ['triangulum', 23, 54, 293],
  ['large-magellanic-cloud', 122.5, 34.7, 32.5],
] as const)('projects the observed major axis, tilt and nearer side of %s', (id, pa, tilt, nearPA) => {
  const galaxy = galaxies.find(entry => entry.id === id)!
  const model = createGalaxyModel(galaxy)
  const line = new Vector3(...observerDirection(galaxy))
  const east = new Vector3(...skyDirection(galaxy.raDeg + 90, 0))
  const north = east.clone().cross(line).normalize()
  const skyPA = (direction: Vector3) =>
    (MathUtils.radToDeg(Math.atan2(direction.dot(east), direction.dot(north))) + 360) % 360
  const major = new Vector3(1, 0, 0).applyQuaternion(model.quaternion)
  const normal = new Vector3(0, 0, 1).applyQuaternion(model.quaternion)
  expect(skyPA(major)).toBeCloseTo(pa, 5)
  expect(MathUtils.radToDeg(line.angleTo(normal))).toBeCloseTo(tilt, 5)
  expect(skyPA(line.clone().projectOnPlane(normal))).toBeCloseTo(nearPA, 5)
})

it('orients the Milky Way bar toward positive Galactic longitude', () => {
  const galaxy = galaxies.find(entry => entry.id === 'milky-way')!
  const orientation = createGalaxyModel(galaxy).quaternion
  const normal = new Vector3(0, 0, 1).applyQuaternion(orientation)
  const sun = new Vector3(...observerDirection(galaxy)).projectOnPlane(normal).normalize()
  const bar = new Vector3(1, 0, 0).applyQuaternion(orientation)
  const positiveLongitude = sun.clone().cross(normal)
  expect(MathUtils.radToDeg(sun.angleTo(bar))).toBeCloseTo(30, 5)
  expect(bar.dot(positiveLongitude)).toBeCloseTo(0.5, 5)
})
