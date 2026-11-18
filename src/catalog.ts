import { galacticCenter, lightYearsToKpc } from './physics'

export interface Source { title: string; url: string }
export interface Galaxy {
  id: string
  name: string
  hostId?: 'milky-way' | 'andromeda'
  absoluteMagnitudeV?: number
  axisRatio?: number
  classification: string
  raDeg: number
  decDeg: number
  distanceKpc: number
  diameterKpc: number
  sizeNote: string
  modelNote: string
  model: 'barred' | 'ringed' | 'open-spiral' | 'bar-cloud' | 'wing-cloud' | 'spheroid' | 'irregular-dwarf'
  orientation: { inclinationDeg: number; positionAngleDeg: number } | 'galactic-plane'
  sources: Source[]
}

const distances = { title: 'Sky positions and distances · A. W. McConnachie (2012), Tables 1–2', url: 'https://doi.org/10.1088/0004-6256/144/1/4' }
const spiralAngles = { title: 'Disk angles · Sasaki et al. (2012), Table 6', url: 'https://www.aanda.org/articles/aa/full_html/2012/08/aa19025-12/aa19025-12.html' }
const cloudPhoto = { title: 'Visible extent and sky photograph · ESO/M. Zamani', url: 'https://www.eso.org/public/images/potw2216a/' }
const cloudStructure = { title: 'Stellar structure · El Youssoufi et al. (2019)', url: 'https://doi.org/10.1093/mnras/stz2400' }
const milkyWaySize = { title: 'Stellar disk size · NASA', url: 'https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/' }

const brightGalaxies: Galaxy[] = [
  {
    id: 'milky-way', name: 'Milky Way', classification: 'Barred spiral',
    ...galacticCenter, diameterKpc: lightYearsToKpc(100000),
    sizeNote: 'Approximate luminous disk diameter of 100,000 light-years.',
    modelNote: 'A warm elongated bar crosses a thin disk of blue spiral arms. Arm paths and stellar colors are schematic. The disk follows the Galactic plane. The bar’s near end points 30° from the center–Sun line toward positive Galactic longitude.',
    model: 'barred', orientation: 'galactic-plane',
    sources: [milkyWaySize, { title: 'Long bar angle · Wegg et al. (2015)', url: 'https://academic.oup.com/mnras/article/450/4/4050/989881' }, { title: 'Bar and arms · NASA/JPL-Caltech', url: 'https://science.nasa.gov/resource/the-milky-way-galaxy/' },
      { title: 'Distance to the Galactic center · GRAVITY Collaboration (2019)', url: 'https://doi.org/10.1051/0004-6361/201935656' }]
  },
  {
    id: 'andromeda', name: 'Andromeda', classification: 'Spiral galaxy',
    raDeg: 10.6847, decDeg: 41.269, distanceKpc: 783, diameterKpc: 41,
    sizeNote: 'Bright optical disk spanning about 3° on the sky, or roughly 41 kpc at the adopted distance.',
    modelNote: 'A warm central bulge rises above a thin, inclined disk. Broken blue rings and gaps trace the bright arms and dust lanes. The northwest disk is closer to us. The ring paths, dust lanes and individual stars are schematic.',
    model: 'ringed', orientation: { inclinationDeg: 77, positionAngleDeg: 38 },
    sources: [{ title: 'Hubble PHAT · resolved-star photometry and image mosaics', url: 'https://archive.stsci.edu/hlsp/phat' },
      { title: 'Visible-light reference · © Robert Gendler, via NASA APOD', url: 'https://science.nasa.gov/image-article/apod-2009-may-10-m31-the-andromeda-galaxy/' },
      { title: 'Apparent span · NASA Hubble Messier catalog', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/' }, distances, { title: 'M31 disk angles · Tempel et al. (2011)', url: 'https://www.aanda.org/articles/aa/full_html/2011/02/aa16067-10/aa16067-10.html' }]
  },
  {
    id: 'triangulum', name: 'Triangulum', classification: 'Spiral galaxy',
    raDeg: 23.4621, decDeg: 30.6599, distanceKpc: 809, diameterKpc: lightYearsToKpc(50000),
    sizeNote: 'Approximate bright stellar disk, taken as half the Milky Way’s adopted diameter.',
    modelNote: 'Loose blue arms, scattered pink star-forming regions and a small core trace its patchy optical disk. The west side of its disk is closer to us. The arm positions, branches and colors are illustrative.',
    model: 'open-spiral', orientation: { inclinationDeg: 54, positionAngleDeg: 23 },
    sources: [{ title: 'Hubble PHATTER · multiband stellar photometry', url: 'https://archive.stsci.edu/hlsp/phatter' },
      { title: 'Optical disk and relative size · NASA Hubble Messier catalog', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-33/' }, distances, spiralAngles]
  },
  {
    id: 'large-magellanic-cloud', name: 'Large Magellanic Cloud', hostId: 'milky-way', classification: 'Magellanic irregular',
    raDeg: 80.8942, decDeg: -69.7561, distanceKpc: 51, diameterKpc: lightYearsToKpc(14000),
    sizeNote: 'Approximate width of the bright visible body, 14,000 light-years in the ESO reference.',
    modelNote: 'An off-center stellar bar and uneven blue knots outline its lopsided body. The adopted disk tilt follows red-giant measurements, with the northeast side closer to us. Individual knots and depth are illustrative.',
    model: 'bar-cloud', orientation: { inclinationDeg: 34.7, positionAngleDeg: 122.5 },
    sources: [cloudPhoto, cloudStructure, distances, { title: 'Viewing angles · van der Marel & Cioni (2001)', url: 'https://arxiv.org/abs/astro-ph/0105339' }]
  },
  {
    id: 'small-magellanic-cloud', name: 'Small Magellanic Cloud', hostId: 'milky-way', classification: 'Dwarf irregular',
    raDeg: 13.1867, decDeg: -72.8286, distanceKpc: 64, diameterKpc: lightYearsToKpc(7000),
    sizeNote: 'Approximate width of the bright visible body, 7,000 light-years in the ESO reference.',
    modelNote: 'An elongated main body breaks into clumps and a fainter eastern wing. The across-sky extent guides the outline. Its line-of-sight depth and orientation are schematic.',
    model: 'wing-cloud', orientation: { inclinationDeg: 0, positionAngleDeg: 90 },
    sources: [cloudPhoto, cloudStructure, distances]
  }
]

interface DwarfRecord {
  key: string
  name: string
  id: string
  hostId?: Galaxy['hostId']
  classification: string
  raDeg: number
  decDeg: number
  distanceKpc: number
  halfLightRadiusPc: number
  ellipticity: number
  positionAngleDeg: number
  absoluteMagnitudeV: number
}

// Rounded measurements from the named rows of Pace's Local Volume Database v1.1.2.
const dwarfs: DwarfRecord[] = [
  { key: 'carina_1', name: 'Carina', id: 'carina', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 100.4065, decDeg: -50.9593, distanceKpc: 105.6, halfLightRadiusPc: 310,
    ellipticity: 0.36, positionAngleDeg: 60.0, absoluteMagnitudeV: -9.43 },
  { key: 'draco_1', name: 'Draco', id: 'draco', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 260.0649, decDeg: 57.9196, distanceKpc: 81.5, halfLightRadiusPc: 257,
    ellipticity: 0.266, positionAngleDeg: 92.37, absoluteMagnitudeV: -8.87 },
  { key: 'fornax_1', name: 'Fornax', id: 'fornax', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 39.9708, decDeg: -34.5069, distanceKpc: 142.6, halfLightRadiusPc: 825,
    ellipticity: 0.29, positionAngleDeg: 42.7, absoluteMagnitudeV: -13.39 },
  { key: 'leo_1', name: 'Leo I', id: 'leo-i', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 152.1146, decDeg: 12.3059, distanceKpc: 258.2, halfLightRadiusPc: 274,
    ellipticity: 0.3, positionAngleDeg: 78.0, absoluteMagnitudeV: -11.82 },
  { key: 'leo_2', name: 'Leo II', id: 'leo-ii', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 168.3627, decDeg: 22.1529, distanceKpc: 208.9, halfLightRadiusPc: 153,
    ellipticity: 0.07, positionAngleDeg: 38.0, absoluteMagnitudeV: -9.48 },
  { key: 'sculptor_1', name: 'Sculptor', id: 'sculptor', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 15.0183, decDeg: -33.7186, distanceKpc: 84.0, halfLightRadiusPc: 273,
    ellipticity: 0.33, positionAngleDeg: 92.0, absoluteMagnitudeV: -10.77 },
  { key: 'sagittarius_1', name: 'Sagittarius', id: 'sagittarius', classification: 'Dwarf spheroidal', hostId: 'milky-way',
    raDeg: 284.0952, decDeg: -30.5499, distanceKpc: 26.3, halfLightRadiusPc: 2608,
    ellipticity: 0.64, positionAngleDeg: 102.0, absoluteMagnitudeV: -13.5 },
  { key: 'andromeda_01', name: 'Andromeda I', id: 'andromeda-i', classification: 'Dwarf spheroidal', hostId: 'andromeda',
    raDeg: 11.4154, decDeg: 38.0375, distanceKpc: 776.2, halfLightRadiusPc: 880,
    ellipticity: 0.28, positionAngleDeg: 30.0, absoluteMagnitudeV: -11.35 },
  { key: 'andromeda_03', name: 'Andromeda III', id: 'andromeda-iii', classification: 'Dwarf spheroidal', hostId: 'andromeda',
    raDeg: 8.8788, decDeg: 36.4989, distanceKpc: 721.1, halfLightRadiusPc: 418,
    ellipticity: 0.59, positionAngleDeg: 140.0, absoluteMagnitudeV: -9.49 },
  { key: 'm_032', name: 'M32', id: 'm32', classification: 'Compact elliptical', hostId: 'andromeda',
    raDeg: 10.6741, decDeg: 40.8651, distanceKpc: 772.7, halfLightRadiusPc: 105,
    ellipticity: 0.25, positionAngleDeg: 159.0, absoluteMagnitudeV: -16.34 },
  { key: 'ngc_0147', name: 'NGC 147', id: 'ngc-147', classification: 'Dwarf elliptical', hostId: 'andromeda',
    raDeg: 8.2983, decDeg: 48.5078, distanceKpc: 734.5, halfLightRadiusPc: 1430,
    ellipticity: 0.46, positionAngleDeg: 34.2, absoluteMagnitudeV: -16.57 },
  { key: 'ngc_0185', name: 'NGC 185', id: 'ngc-185', classification: 'Dwarf elliptical', hostId: 'andromeda',
    raDeg: 9.7417, decDeg: 48.3361, distanceKpc: 648.6, halfLightRadiusPc: 554,
    ellipticity: 0.22, positionAngleDeg: 45.9, absoluteMagnitudeV: -15.6 },
  { key: 'ngc_0205', name: 'NGC 205', id: 'ngc-205', classification: 'Dwarf elliptical', hostId: 'andromeda',
    raDeg: 10.0938, decDeg: 41.6864, distanceKpc: 835.6, halfLightRadiusPc: 597,
    ellipticity: 0.43, positionAngleDeg: 28.0, absoluteMagnitudeV: -16.51 },
  { key: 'ic_1613', name: 'IC 1613', id: 'ic-1613', classification: 'Dwarf irregular',
    raDeg: 16.1992, decDeg: 2.1178, distanceKpc: 731.1, halfLightRadiusPc: 1610,
    ellipticity: 0.2, positionAngleDeg: 90.49, absoluteMagnitudeV: -15.12 },
  { key: 'ngc_6822', name: 'NGC 6822', id: 'ngc-6822', classification: 'Dwarf irregular',
    raDeg: 296.2358, decDeg: -14.7892, distanceKpc: 570.2, halfLightRadiusPc: 1982,
    ellipticity: 0.28, positionAngleDeg: 66.88, absoluteMagnitudeV: -15.68 },
  { key: 'wlm', name: 'WLM', id: 'wlm', classification: 'Dwarf irregular',
    raDeg: 0.4925, decDeg: -15.4608, distanceKpc: 989.5, halfLightRadiusPc: 1179,
    ellipticity: 0.54, positionAngleDeg: 177.02, absoluteMagnitudeV: -14.38 },
  { key: 'cetus_1', name: 'Cetus', id: 'cetus', classification: 'Dwarf spheroidal',
    raDeg: 6.5458, decDeg: -11.0444, distanceKpc: 755.1, halfLightRadiusPc: 702,
    ellipticity: 0.33, positionAngleDeg: 63.0, absoluteMagnitudeV: -11.19 },
  { key: 'tucana_1', name: 'Tucana', id: 'tucana', classification: 'Dwarf spheroidal',
    raDeg: 340.4567, decDeg: -64.4194, distanceKpc: 887.2, halfLightRadiusPc: 283,
    ellipticity: 0.48, positionAngleDeg: 97.0, absoluteMagnitudeV: -9.54 },
]
const lvdbRelease = 'https://github.com/apace7/local_volume_database'
function dwarfGalaxy(record: DwarfRecord): Galaxy {
  const irregular = record.classification === 'Dwarf irregular'
  const sources = [
    { title: 'Measurements and original references · Local Volume Database v1.1.2',
      url: `${lvdbRelease}/blob/v1.1.2/data_input/${record.key}.yaml` },
    { title: 'Catalog methods · Andrew B. Pace', url: 'https://arxiv.org/abs/2411.07424' }
  ]
  if (record.id === 'ic-1613') sources.push({
    title: 'VLA LITTLE THINGS · neutral hydrogen maps and data cube',
    url: 'https://science.nrao.edu/science/surveys/littlethings/data/ic1613.html'
  })
  if (record.id === 'wlm') sources.push({
    title: 'JWSTSTARS · Webb infrared imaging and resolved-star photometry',
    url: 'https://archive.stsci.edu/hlsp/jwststars'
  })
  return {
    id: record.id, name: record.name, classification: record.classification, hostId: record.hostId,
    raDeg: record.raDeg, decDeg: record.decDeg, distanceKpc: record.distanceKpc,
    diameterKpc: 4 * record.halfLightRadiusPc / 1000, absoluteMagnitudeV: record.absoluteMagnitudeV,
    axisRatio: 1 - record.ellipticity, orientation: { inclinationDeg: 0, positionAngleDeg: record.positionAngleDeg },
    model: irregular ? 'irregular-dwarf' : 'spheroid',
    sizeNote: `The model extends to twice the measured half-light semimajor radius (${record.halfLightRadiusPc} pc) on each side. Fainter stars extend beyond this adopted boundary.`,
    modelNote: `The projected shape follows the measured ellipticity of ${record.ellipticity} and position angle of ${record.positionAngleDeg}°. ` +
      (irregular ? 'Blue stellar clumps illustrate its irregular morphology.' : 'A smooth stellar body illustrates the observed central concentration.') +
      ' Depth, individual stars and colors are illustrative.',
    sources
  }
}

export const galaxies: Galaxy[] = [...brightGalaxies, ...dwarfs.map(dwarfGalaxy)]
for (const galaxy of galaxies) {
  const fieldDeg = galaxy.id === 'milky-way' ? 10 : 1.5 * 2 * Math.atan(galaxy.diameterKpc / (2 * galaxy.distanceKpc)) * 180 / Math.PI
  const query = new URLSearchParams({
    target: `${galaxy.raDeg} ${galaxy.decDeg}`, fov: fieldDeg.toPrecision(3), survey: 'CDS/P/DSS2/color'
  })
  galaxy.sources.push({ title: 'Observed sky · DSS2 optical survey in CDS Aladin', url: `https://aladin.cds.unistra.fr/AladinLite/?${query}` })
}
