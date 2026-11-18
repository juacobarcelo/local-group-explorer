import * as THREE from 'three';
import { gravityBodies, gravityPositionAt, gravityTimeLimitMyr, straightPositionAt } from './gravity';

// A spherical Plummer halo projects on the sky as (1 + R²/a²)^−2.
// Normalize the central brightness of each halo to make all three readable.
function makeHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const r = Math.hypot(x - 127.5, y - 127.5) * 3 / 128;
      const i = 4 * (256 * y + x);
      pixels.data.set([146, 139, 255, r < 3 ? 180 / (1 + r * r) ** 2 : 0], i);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  ctx.strokeStyle = 'rgba(171,163,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(128, 128, 128 / 3, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGravityView() {
  const group = new THREE.Group();
  const paths = new THREE.Group();
  const halos = new THREE.Group();
  group.add(paths, halos);
  const gravityLine = new THREE.LineBasicMaterial({ color: 0x6cdcc2 });
  const inertialLine = new THREE.LineDashedMaterial({ color: 0xffc878, dashSize: 2.0, gapSize: 1.4 });
  const material = new THREE.SpriteMaterial({
    map: makeHaloTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pathPoints: THREE.Vector3[] = [];
  for (const body of gravityBodies) {
    const halo = new THREE.Sprite(material);
    halo.name = body.id;
    halo.scale.setScalar(6 * body.haloScaleKpc);
    halos.add(halo);
    // In the Milky Way frame its own center stays at the origin on both tracks.
    if (body.id === 'milky-way') continue;
    for (const project of [gravityPositionAt, straightPositionAt]) {
      const points: THREE.Vector3[] = [];
      for (let t = -gravityTimeLimitMyr; t <= gravityTimeLimitMyr; t += 5) {
        points.push(new THREE.Vector3(...project(body.id, t)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
        project === gravityPositionAt ? gravityLine : inertialLine);
      line.computeLineDistances();
      paths.add(line);
      pathPoints.push(...points);
    }
  }

  function update(time: number, separation: number, showHalos: boolean, showPaths: boolean) {
    group.scale.setScalar(separation);
    halos.visible = showHalos;
    paths.visible = showPaths;
    halos.children.forEach(halo => halo.position.fromArray(gravityPositionAt(halo.name, time)));
  }
  return { group, paths, halos, pathPoints, update };
}
