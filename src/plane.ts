import { GridHelper, Matrix4, Vector3 } from 'three';

export function createReferencePlane(origin: Vector3, andromeda: Vector3, triangulum: Vector3) {
  const baseline = andromeda.clone().sub(origin);
  const along = baseline.clone().normalize();
  const normal = baseline.clone().cross(triangulum.clone().sub(origin)).normalize();
  const across = along.clone().cross(normal);
  const center = origin.clone().addScaledVector(baseline, 0.5);
  const radius = Math.max(center.distanceTo(origin), center.distanceTo(triangulum));

  const grid = new GridHelper(radius * 2.4, 20, 0x83aaad, 0x5b8e92);
  grid.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(along, normal, across));
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  grid.material.depthWrite = false;
  grid.visible = false;
  return { grid, center, normal, across };
}
