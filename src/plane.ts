import { GridHelper, Matrix4, Vector3 } from 'three';

export function createReferencePlane() {
  const grid = new GridHelper(1, 20, 0x83aaad, 0x5b8e92);
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  grid.material.depthWrite = false;
  grid.visible = false;

  const normal = new Vector3();
  const along = new Vector3();
  const across = new Vector3();
  const basis = new Matrix4();
  function update(origin: Vector3, andromeda: Vector3, triangulum: Vector3) {
    along.subVectors(andromeda, origin).normalize();
    normal.subVectors(triangulum, origin).cross(along).negate().normalize();
    across.crossVectors(along, normal);
    grid.position.lerpVectors(origin, andromeda, 0.5);
    const radius = Math.max(grid.position.distanceTo(origin), grid.position.distanceTo(triangulum));
    grid.scale.setScalar(radius * 2.4);
    grid.quaternion.setFromRotationMatrix(basis.makeBasis(along, normal, across));
  }
  return { grid, normal, across, update };
}
