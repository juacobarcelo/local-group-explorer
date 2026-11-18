import type { Galaxy, Source } from './catalog'
import { placement, radians, skyDirection, type Coordinates } from './physics'

export const timeLimitMyr = 10
// One Julian Myr in seconds divided by the number of km in one kpc.
const kpcPerKmPerSecMyr = 31557600000000 / 3.085677581491367e16
const kmsPerMasYrKpc = 4.74047
const catalog: Source = { title: 'Local Volume Database v1.1.2 · measurements and references', url: 'https://github.com/apace7/local_volume_database/releases/tag/v1.1.2' }
const wu: Source = { title: 'M31 and M33 proper motions · Wu et al. (2025)', url: 'https://doi.org/10.1051/0004-6361/202555477' }
const gaiaRotation: Source = { title: 'M31 and M33 disk rotation · van der Marel et al. (2019)', url: 'https://arxiv.org/abs/1805.04079' }

interface Astrometry {
  radialKms: number
  eastMasYr: number
  northMasYr: number
  eastError: number
  northError: number
  source: Source
}

function measurement(radialKms: number, eastMasYr: number, northMasYr: number, eastError: number, northError: number, source: Source): Astrometry {
  return { radialKms, eastMasYr, northMasYr, eastError, northError, source }
}

function paper(title: string, bibcode: string): Source {
  return { title, url: 'https://ui.adsabs.harvard.edu/abs/' + bibcode + '/abstract' }
}

const pace = paper('Gaia proper motions · Pace et al. (2022)', '2022ApJ...940..136P')
const leo = paper('Leo proper motions · Bennet et al. (2024)', '2024ApJ...971...98B')
const distant = paper('Hubble proper motions · Bennet et al. (2025)', '2025ApJ...993..228B')
const m31Satellites = paper('Hubble proper motions · Sohn et al. (2020)', '2020ApJ...901...43S')
const battaglia = paper('Gaia proper motions · Battaglia et al. (2022)', '2022A&A...657A..54B')

// The two errors are the larger quoted side of the respective proper-motion interval.
const astrometry: Record<string, Astrometry> = {
  andromeda: measurement(-300, 0.0459, -0.0205, 0.0081, 0.0066, wu),
  triangulum: measurement(-179.2, 0.0453, 0.0263, 0.0097, 0.0073, wu),
  'carina': measurement(222.9, 0.532, 0.127, 0.007, 0.006, pace),
  'draco': measurement(-292.2, 0.044, -0.188, 0.006, 0.006, pace),
  'fornax': measurement(55.2, 0.381, -0.359, 0.001, 0.002, pace),
  'leo-i': measurement(285.9, -0.063, -0.111, 0.005, 0.004, leo),
  'leo-ii': measurement(78.8, -0.143, -0.13, 0.009, 0.009, leo),
  'large-magellanic-cloud': measurement(262.2, 1.91, 0.229, 0.02, 0.047, paper('Hubble proper motions · Kallivayalil et al. (2013)', '2013ApJ...764..161K')),
  'sagittarius': measurement(140.0, -2.679, -1.394, 0.001, 0.001, paper('Sagittarius proper motion · An et al. (2024)', '2024MNRAS.532.3713A')),
  'sculptor': measurement(111.4, 0.1, -0.158, 0.002, 0.002, pace),
  'small-magellanic-cloud': measurement(145.6, 0.83, -1.21, 0.02, 0.01, paper('Hubble proper motions · Zivick et al. (2018)', '2018ApJ...864...55Z')),
  'andromeda-iii': measurement(-344.3, -0.0105, 0.0475, 0.0125, 0.0125, paper('Andromeda III proper motion · Casetti-Dinescu et al. (2024)', '2024ApJ...975..138C')),
  'ngc-147': measurement(-193.1, 0.0232, 0.0378, 0.0143, 0.0146, m31Satellites),
  'ngc-185': measurement(-203.8, 0.0242, 0.0058, 0.0141, 0.0147, m31Satellites),
  'cetus': measurement(-83.9, 0.0618, -0.073, 0.0106, 0.01, distant),
  'ic-1613': measurement(-231.6, 0.04, 0.01, 0.02, 0.01, battaglia),
  'ngc-6822': measurement(-54.5, -0.06, -0.07, 0.01, 0.01, battaglia),
  'tucana': measurement(180.0, 0.0135, -0.0224, 0.0074, 0.0074, distant),
  'wlm': measurement(-130.0, 0.09, -0.07, 0.03, 0.02, battaglia),
}

interface DiskRotation { speedKms: number; radiusKpc: number; source: Source }
const rotation: Record<string, DiskRotation> = {
  'milky-way': { speedKms: -229, radiusKpc: 8.2, source: paper('Milky Way circular speed · Eilers et al. (2019)', '2019ApJ...871..120E') },
  andromeda: { speedKms: 206, radiusKpc: 10, source: gaiaRotation },
  triangulum: { speedKms: -80, radiusKpc: 4, source: gaiaRotation },
  'large-magellanic-cloud': { speedKms: -59.4, radiusKpc: 1.8, source: paper('LMC rotation curve · van der Marel & Kallivayalil (2014)', '2014ApJ...781..121V') }
}

// ICRS directions of Galactic U, V and W in scene coordinates (X_icrs, Z_icrs, -Y_icrs).
// Gaia DR3 documentation, eq. 4.62. Adopt the Astropy v4.0 solar velocity in km/s.
const solarVelocity: Coordinates = [0, 1, 2].map(i =>
  12.9 * [-0.0548755604, -0.4838350155, 0.8734370902][i]
  + 245.6 * [0.4941094279, 0.7469822445, 0.4448296300][i]
  + 7.78 * [-0.8676661490, 0.4559837762, 0.1980763734][i]
) as Coordinates

function velocity(galaxy: Galaxy, data: Astrometry): Coordinates {
  const ra = radians(galaxy.raDeg)
  const dec = radians(galaxy.decDeg)
  const out = skyDirection(galaxy.raDeg, galaxy.decDeg)
  const east = [-Math.sin(ra), 0, -Math.cos(ra)]
  const north = [-Math.sin(dec) * Math.cos(ra), Math.cos(dec), Math.sin(dec) * Math.sin(ra)]
  const scale = kmsPerMasYrKpc * galaxy.distanceKpc
  return out.map((direction, i) =>
    direction * data.radialKms + scale * (east[i] * data.eastMasYr + north[i] * data.northMasYr) + solarVelocity[i]
  ) as Coordinates
}

function boundedTime(timeMyr: number) {
  return Math.max(-timeLimitMyr, Math.min(timeLimitMyr, timeMyr))
}

export function centerVelocityKpcPerMyr(galaxy: Galaxy): Coordinates | undefined {
  if (galaxy.id === 'milky-way') return [0, 0, 0]
  const data = astrometry[galaxy.id]
  if (!data) return undefined
  return velocity(galaxy, data).map(kms => kms * kpcPerKmPerSecMyr) as Coordinates
}

export function positionAt(galaxy: Galaxy, timeMyr: number, separation = 1): Coordinates {
  const base = placement(galaxy, 1, separation).center
  if (timeMyr === 0) return base
  const drift = centerVelocityKpcPerMyr(galaxy)
  if (!drift) return base
  const scale = boundedTime(timeMyr) * separation
  return base.map((coordinate, i) => coordinate + drift[i] * scale) as Coordinates
}

// Rotation around the local disk normal at the representative physical radius.
export function spinAt(galaxy: Galaxy, timeMyr: number): number {
  const disk = rotation[galaxy.id]
  return disk ? boundedTime(timeMyr) * kpcPerKmPerSecMyr * disk.speedKms / disk.radiusKpc : 0
}

export function diskRadii(galaxy: Galaxy) {
  const disk = rotation[galaxy.id]
  const reference = disk ? disk.radiusKpc / galaxy.diameterKpc : 1
  return { reference, core: reference / 3 }
}

export function motionInfo(galaxy: Galaxy) {
  const data = astrometry[galaxy.id]
  const disk = rotation[galaxy.id]
  let translation = galaxy.id === 'milky-way' ? 'Milky Way center defines the stationary origin.'
    : 'Full space velocity unavailable in this model. Center held at its present position.'
  const sources: Source[] = []
  if (data) {
    const speed = Math.round(Math.hypot(...velocity(galaxy, data)))
    translation = `Linear drift at about ${speed} km/s relative to the Milky Way center. Proper motion in milliarcseconds per year is ${data.eastMasYr} ± ${data.eastError} east and ${data.northMasYr} ± ${data.northError} north. Radial velocity relative to the Sun is ${data.radialKms} km/s.`
    sources.push(data.source, catalog)
  }
  if (disk) sources.push(disk.source)
  return {
    translation,
    rotation: disk ? `Differential disk rotation, scaled to ${Math.abs(disk.speedKms)} km/s at a reference radius of ${disk.radiusKpc} kpc. The radial profile is illustrative.` : 'Internal stellar motion is unmodeled.',
    sources
  }
}
