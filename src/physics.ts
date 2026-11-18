import type { Galaxy } from './catalog'

export type Coordinates = [number, number, number]
export const radians = (degrees: number) => degrees * Math.PI / 180
export const lightYearsPerKpc = 3261.56
export const lightYearsToKpc = (lightYears: number) => lightYears / lightYearsPerKpc

export function logarithmicDiameter(diameterKpc: number, largestDiameterKpc: number): number {
  // A wide log range keeps the faintest dwarfs legible in a group-wide view.
  const contrast = 10000
  return 2 * largestDiameterKpc * (Math.log1p(contrast * (diameterKpc / largestDiameterKpc)) / Math.log1p(contrast))
}

// Meet halfway between neighboring centers. Each side keeps a fixed envelope as the slider increases.
export function cappedDiameters(centers: readonly Coordinates[], baseDiameters: readonly number[], sizeScale: number): number[] {
  const diameters = baseDiameters.map(diameter => diameter * sizeScale)
  for (let i = 0; i < centers.length; i++) {
    const [x, y, z] = centers[i]
    for (let j = i + 1; j < centers.length; j++) {
      const other = centers[j]
      const distance = Math.hypot(x - other[0], y - other[1], z - other[2])
      const diameterLimit = 0.95 * distance
      diameters[i] = Math.min(diameters[i], diameterLimit)
      diameters[j] = Math.min(diameters[j], diameterLimit)
    }
  }
  return diameters
}

/** Equatorial J2000 coordinates with celestial north up and increasing RA toward -Z. */
export function skyDirection(raDeg: number, decDeg: number): Coordinates {
  const ra = radians(raDeg)
  const dec = radians(decDeg)
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra)]
}

export function observerDirection(galaxy: Galaxy): Coordinates {
  const [x, y, z] = skyDirection(galaxy.raDeg, galaxy.decDeg)
  return [-x, -y, -z]
}

export const galacticCenter = { raDeg: 266.4051, decDeg: -28.936175, distanceKpc: 8.2 }
const origin = skyDirection(galacticCenter.raDeg, galacticCenter.decDeg)

export function placement(galaxy: Galaxy, sizeScale = 1, separationScale = 1) {
  const line = skyDirection(galaxy.raDeg, galaxy.decDeg)
  const center = line.map((component, i) =>
    (galaxy.distanceKpc * component - galacticCenter.distanceKpc * origin[i]) * separationScale
  ) as Coordinates
  return { center, diameter: galaxy.diameterKpc * sizeScale }
}
