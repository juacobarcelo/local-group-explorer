import { galacticCenter, lightYearsToKpc } from './physics'

export interface Source { title: string; url: string }
export interface Galaxy {
  id: string
  name: string
  classification: string
  raDeg: number
  decDeg: number
  distanceKpc: number
  diameterKpc: number
  sizeNote: string
  modelNote: string
  model: 'barred' | 'ringed' | 'open-spiral' | 'bar-cloud' | 'wing-cloud'
  orientation: { inclinationDeg: number; positionAngleDeg: number } | 'galactic-plane'
  sources: Source[]
}

const distances = { title: 'Sky positions and distances · A. W. McConnachie (2012), Tables 1–2', url: 'https://doi.org/10.1088/0004-6256/144/1/4' }
const spiralAngles = { title: 'Disk angles · Sasaki et al. (2012), Table 6', url: 'https://www.aanda.org/articles/aa/full_html/2012/08/aa19025-12/aa19025-12.html' }
const cloudPhoto = { title: 'Visible extent and sky photograph · ESO/M. Zamani', url: 'https://www.eso.org/public/images/potw2216a/' }
const cloudStructure = { title: 'Stellar structure · El Youssoufi et al. (2019)', url: 'https://doi.org/10.1093/mnras/stz2400' }
const milkyWaySize = { title: 'Stellar disk size · NASA', url: 'https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/' }

export const galaxies: Galaxy[] = [
  {
    id: 'milky-way', name: 'Milky Way', classification: 'Barred spiral',
    ...galacticCenter, diameterKpc: lightYearsToKpc(100000),
    sizeNote: 'Approximate luminous disk diameter of 100,000 light-years.',
    modelNote: 'A warm elongated bar crosses a thin disk of blue spiral arms. Arm paths and stellar colors are schematic. The disk follows the Galactic plane.',
    model: 'barred', orientation: 'galactic-plane',
    sources: [milkyWaySize, { title: 'Bar and arms · NASA/JPL-Caltech', url: 'https://science.nasa.gov/resource/the-milky-way-galaxy/' },
      { title: 'Distance to the Galactic center · GRAVITY Collaboration (2019)', url: 'https://doi.org/10.1051/0004-6361/201935656' }]
  },
  {
    id: 'andromeda', name: 'Andromeda', classification: 'Spiral galaxy',
    raDeg: 10.6847, decDeg: 41.269, distanceKpc: 783, diameterKpc: 41,
    sizeNote: 'Bright optical disk spanning about 3° on the sky, or roughly 41 kpc at the adopted distance.',
    modelNote: 'A warm central bulge rises above a thin, inclined disk. Broken blue rings and gaps trace the bright arms and dust lanes. Individual dust clouds and stars are reconstructed.',
    model: 'ringed', orientation: { inclinationDeg: 77, positionAngleDeg: 38 },
    sources: [{ title: 'Visible-light reference · © Robert Gendler, via NASA APOD', url: 'https://science.nasa.gov/image-article/apod-2009-may-10-m31-the-andromeda-galaxy/' },
      { title: 'Apparent span · NASA Hubble Messier catalog', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/' }, distances, { title: 'M31 disk angles · Tempel et al. (2011)', url: 'https://www.aanda.org/articles/aa/full_html/2011/02/aa16067-10/aa16067-10.html' }]
  },
  {
    id: 'triangulum', name: 'Triangulum', classification: 'Spiral galaxy',
    raDeg: 23.4621, decDeg: 30.6599, distanceKpc: 809, diameterKpc: lightYearsToKpc(50000),
    sizeNote: 'Approximate bright stellar disk, taken as half the Milky Way’s adopted diameter.',
    modelNote: 'Loose blue arms, scattered pink star-forming regions and a small core trace its patchy optical disk. Exact arm branches and colors are illustrative.',
    model: 'open-spiral', orientation: { inclinationDeg: 54, positionAngleDeg: 23 },
    sources: [{ title: 'Optical disk and relative size · NASA Hubble Messier catalog', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-33/' }, distances, spiralAngles]
  },
  {
    id: 'large-magellanic-cloud', name: 'Large Magellanic Cloud', classification: 'Magellanic irregular',
    raDeg: 80.8942, decDeg: -69.7561, distanceKpc: 51, diameterKpc: lightYearsToKpc(14000),
    sizeNote: 'Approximate width of the bright visible body, 14,000 light-years in the ESO reference.',
    modelNote: 'An off-center stellar bar and uneven blue knots outline its lopsided body. The adopted disk tilt follows red-giant measurements. Individual knots and depth are illustrative.',
    model: 'bar-cloud', orientation: { inclinationDeg: 34.7, positionAngleDeg: 122.5 },
    sources: [cloudPhoto, cloudStructure, distances, { title: 'Viewing angles · van der Marel & Cioni (2001)', url: 'https://arxiv.org/abs/astro-ph/0105339' }]
  },
  {
    id: 'small-magellanic-cloud', name: 'Small Magellanic Cloud', classification: 'Dwarf irregular',
    raDeg: 13.1867, decDeg: -72.8286, distanceKpc: 64, diameterKpc: lightYearsToKpc(7000),
    sizeNote: 'Approximate width of the bright visible body, 7,000 light-years in the ESO reference.',
    modelNote: 'An elongated main body breaks into clumps and a fainter eastern wing. The across-sky extent guides the outline. Its line-of-sight depth and orientation are schematic.',
    model: 'wing-cloud', orientation: { inclinationDeg: 0, positionAngleDeg: 90 },
    sources: [cloudPhoto, cloudStructure, distances]
  }
]
