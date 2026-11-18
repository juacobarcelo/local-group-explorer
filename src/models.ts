import {
  AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, Matrix4,
  Points, ShaderMaterial, Vector2, Vector3
} from 'three'
import type { Galaxy } from './catalog'
import { diskRadii } from './motion'
import { observerDirection, radians, skyDirection } from './physics'

function randomSequence(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return (seed + 0.5) / 4294967296
  }
}

type Sample = { x: number; y: number; z: number; color: number[] }
const amber = [1, 0.72, 0.46]
const ivory = [1, 0.89, 0.75]
const blue = [0.49, 0.69, 1]
const pink = [1, 0.48, 0.63]

function sampleSpiral(model: Galaxy['model'], random: () => number, normal: () => number): Sample {
  const ringed = model === 'ringed'
  const barred = model === 'barred'
  if (random() < (ringed ? 0.30 : barred ? 0.22 : 0.045)) {
    const core = random() ** 1.7
    return {
      x: normal() * core * (barred ? 0.085 : 0.052), y: normal() * core * (barred ? 0.023 : 0.051),
      z: normal() * core * 0.035, color: random() < 0.8 ? amber : ivory
    }
  }

  let radius = 0.5 * Math.sqrt(random()) * (0.3 + 0.7 * random())
  let angle = random() * Math.PI * 2
  const onArm = random() < 0.64
  if (onArm && ringed) {
    radius = (random() < 0.62 ? 0.24 : 0.365) + 0.025 * Math.sin(angle * 2 + 0.9) +
      0.015 * Math.sin(angle * 5) + 0.019 * normal()
  } else if (onArm) {
    const arm = Math.floor(random() * (barred ? 4 : 3))
    angle = arm * 2 * Math.PI / (barred ? 4 : 3) + 2.1 * Math.log(1 + 13 * radius) +
      normal() * (barred ? 0.12 : 0.22) + (barred ? 0 : 0.24 * Math.sin(radius * 31 + arm))
  }
  const color = onArm && random() < 0.74 ? (model === 'open-spiral' && random() < 0.13 ? pink : blue) : ivory
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: 0.007 * normal(), color }
}

// Each component describes a stellar concentration, its spread and its relative frequency.
const barCloud = [
  [-0.07, 0.045, 0.17, 0.034, 0.45], [0.025, -0.06, 0.18, 0.12, 0.24],
  [0.23, 0.035, 0.055, 0.064, 0.14], [-0.22, -0.10, 0.077, 0.046, 0.10],
  [0.08, -0.20, 0.065, 0.04, 0.07]
]
const wingCloud = [
  [-0.14, 0.055, 0.075, 0.11, 0.4], [-0.053, -0.075, 0.065, 0.078, 0.28],
  [0.063, -0.135, 0.079, 0.045, 0.18], [0.23, -0.087, 0.088, 0.035, 0.14]
]

function sampleCloud(model: Galaxy['model'], random: () => number, normal: () => number): Sample {
  const large = model === 'bar-cloud'
  const components = large ? barCloud : wingCloud
  let choice = random()
  let component = 0
  while (component < components.length - 1 && choice > components[component][4]) {
    choice -= components[component++][4]
  }
  const [cx, cy, width, height] = components[component]
  const x = cx + normal() * width
  const y = cy + normal() * height + 0.026 * Math.sin(15 * x + component)
  const color = large && component === 0 ? ivory : random() < 0.12 ? pink : blue
  return { x, y, z: normal() * (large ? 0.028 : 0.075) + 0.05 * x, color }
}

function sampleDwarf(galaxy: Galaxy, random: () => number, normal: () => number): Sample {
  const axisRatio = galaxy.axisRatio ?? 1
  let x = normal() * 0.20
  let y = normal() * 0.20
  const z = normal() * 0.13
  let color = random() < 0.7 ? ivory : amber
  if (galaxy.model === 'irregular-dwarf' && random() < 0.45) {
    const knot = Math.floor(random() * 4)
    const phase = galaxy.raDeg + knot * 2.4
    x = 0.23 * Math.cos(phase) + 0.055 * normal()
    y = 0.23 * Math.sin(phase) + 0.060 * normal()
    color = random() < 0.9 ? blue : pink
  }
  return { x, y: y * axisRatio, z: z * axisRatio, color }
}

function orient(group: Group, galaxy: Galaxy) {
  let normal: Vector3
  let major: Vector3
  if (galaxy.orientation === 'galactic-plane') {
    normal = new Vector3(...skyDirection(192.85948, 27.12825))
    // The bar's near end lies at positive Galactic longitude, about 30° from the Sun.
    major = new Vector3(...observerDirection(galaxy)).projectOnPlane(normal).normalize()
      .applyAxisAngle(normal, radians(-30))
  } else {
    const ra = radians(galaxy.raDeg)
    const line = new Vector3(...observerDirection(galaxy))
    const east = new Vector3(-Math.sin(ra), 0, -Math.cos(ra))
    const north = new Vector3(0, 1, 0).projectOnPlane(line).normalize()
    const angle = radians(galaxy.orientation.positionAngleDeg)
    major = north.multiplyScalar(Math.cos(angle)).addScaledVector(east, Math.sin(angle)).normalize()
    // Directed node angles in the catalog put the near side at PA minus 90 degrees.
    normal = line.applyAxisAngle(major, -radians(galaxy.orientation.inclinationDeg))
  }
  group.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(major, normal.clone().cross(major), normal))
}

export function createGalaxyModel(galaxy: Galaxy): Group {
  const irregular = galaxy.model === 'wing-cloud' || galaxy.model === 'bar-cloud'
  const random = randomSequence(Math.round(galaxy.raDeg * 1000))
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random())
  const positions: number[] = []
  const colors: number[] = []
  const widths: number[] = []
  const dwarf = galaxy.model === 'spheroid' || galaxy.model === 'irregular-dwarf'
  const count = dwarf ? 3400 : irregular ? 9500 : 22000
  while (widths.length < count) {
    const { x, y, z, color } = dwarf ? sampleDwarf(galaxy, random, normal) : irregular
      ? sampleCloud(galaxy.model, random, normal)
      : sampleSpiral(galaxy.model, random, normal)
    if (Math.hypot(x, y, z) > 0.5) continue
    positions.push(x, y, z)
    const glow = 0.3 + random() ** 2 * 0.7
    colors.push(...color.map(c => c * glow))
    widths.push(0.003 + 0.013 * random() ** 2)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('width', new Float32BufferAttribute(widths, 1))
  const { reference, core } = diskRadii(galaxy)
  const material = new ShaderMaterial({
    vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { contrast: { value: 1 }, viewportHeight: { value: 1 }, minIntensity: { value: 0.00015 }, spinAngle: { value: 0 },
      referenceRadius: { value: reference }, coreRadius: { value: core } },
    vertexShader: `
      uniform float contrast, viewportHeight, minIntensity, spinAngle, referenceRadius, coreRadius;
      attribute float width;
      varying vec3 tint;
      void main() {
        vec3 localPosition = position;
        if (spinAngle != 0.0) {
          // The Points object's rotation supplies the reference annulus angle.
          float radialFactor = sqrt((referenceRadius * referenceRadius + coreRadius * coreRadius)
            / (dot(position.xy, position.xy) + coreRadius * coreRadius));
          float angle = spinAngle * (radialFactor - 1.0);
          float c = cos(angle);
          float s = sin(angle);
          localPosition.xy = mat2(c, s, -s, c) * position.xy;
        }
        vec4 view = modelViewMatrix * vec4(localPosition, 1.0);
        gl_Position = projectionMatrix * view;
        float pixels = width * length(modelViewMatrix[0].xyz) * projectionMatrix[1][1]
          * viewportHeight * 0.5 / max(0.001, -view.z);
        gl_PointSize = clamp(pixels, 1.0, 64.0);
        float floorLight = contrast > 1.0 ? max(minIntensity, 0.25) : minIntensity;
        tint = contrast * color * clamp(pixels * pixels, floorLight, 1.0);
      }`,
    fragmentShader: `
      varying vec3 tint;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;
        gl_FragColor = vec4(tint, exp(-4.0 * r2) * 0.62);
      }`
  })
  const field = new Points(geometry, material)
  const viewport = new Vector2()
  field.onBeforeRender = renderer => {
    material.uniforms.spinAngle.value = field.rotation.z
    material.uniforms.viewportHeight.value = renderer.getDrawingBufferSize(viewport).y
  }
  const group = new Group()
  group.add(field)
  orient(group, galaxy)
  return group
}

// In a group-wide view, subpixel stellar tracers otherwise round down to black.
export function emphasizeSubpixelStars(group: Group, enabled: boolean) {
  const field = group.children[0] as Points<BufferGeometry, ShaderMaterial>
  field.material.uniforms.minIntensity.value = enabled ? 0.28 : 0.00015
}
