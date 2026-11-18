import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { galaxies, type Galaxy } from './catalog';
import { logarithmicDiameter, observerDirection } from './physics';
import { timeLimitMyr, positionAt, spinAt, motionInfo } from './motion';
import { createGalaxyModel } from './models';
import { createReferencePlane } from './plane';
import './style.css';

function element<T extends HTMLElement>(selector: string) {
  return document.querySelector<T>(selector)!;
}
const canvas = element<HTMLCanvasElement>('#sky');
const help = element<HTMLDialogElement>('#controls');
element('#help').onclick = () => help.showModal();
function createRenderer() {
  try {
    return new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    element('#error').hidden = false;
    throw error;
  }
}
const renderer = createRenderer();
renderer.setClearColor(0, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.001, 100000);
camera.position.z = 1;
let sceneDirty = true;
function createControls() {
  const controls = new OrbitControls(camera, canvas);
  controls.addEventListener('change', () => { sceneDirty = true; });
  controls.enablePan = false;
  controls.minDistance = 0.05;
  controls.maxDistance = 16000;
  return controls;
}
let controls = createControls();
function setCameraUp(up: THREE.Vector3) {
  if (camera.up.equals(up)) return;
  const target = controls.target.clone();
  camera.up.copy(up);
  // OrbitControls derives its rotation axis from camera.up during construction.
  controls.dispose();
  controls = createControls();
  controls.target.copy(target);
}

const logSizeButton = element<HTMLButtonElement>('#log-size');
const largestDiameterKpc = Math.max(...galaxies.map(galaxy => galaxy.diameterKpc));
const sizeSlider = element<HTMLInputElement>('#size');
const separationSlider = element<HTMLInputElement>('#separation');
const timeSlider = element<HTMLInputElement>('#time');
timeSlider.min = String(-timeLimitMyr);
timeSlider.max = String(timeLimitMyr);
const epoch = element<HTMLOutputElement>('#epoch');
let timeMyr = 0;
let playback: -1 | 0 | 1 = 0;
let view: 'group' | 'mw-satellites' | 'plane-top' | 'plane-edge' | 'galaxy' | 'flight' = 'group';
let selected: Galaxy | undefined;
let mode: 'overview' | 'orbit' | 'flight' = 'overview';
const models = new Map(galaxies.map(galaxy => {
  const model = createGalaxyModel(galaxy);
  scene.add(model);
  return [galaxy.id, model] as const;
}));
const plane = createReferencePlane();
scene.add(plane.grid);
const showPlane = element<HTMLInputElement>('#show-plane');
showPlane.onchange = () => {
  plane.grid.visible = showPlane.checked;
  sceneDirty = true;
};
element('#vector-horizon').textContent = String(timeLimitMyr);
const showMotion = element<HTMLInputElement>('#show-motion');
const vectors = new THREE.Group();
vectors.visible = false;
scene.add(vectors);
showMotion.onchange = () => {
  vectors.visible = showMotion.checked;
  sceneDirty = true;
};

const labels = element('#labels');
const svgNamespace = 'http://www.w3.org/2000/svg';
const leaders = document.createElementNS(svgNamespace, 'svg');
leaders.setAttribute('aria-hidden','true');
labels.append(leaders);
const entries = galaxies.map(galaxy => {
  const model = models.get(galaxy.id)!;
  // Render the catalog thumbnail from the same geometry as the full-size view.
  const preview = new THREE.Scene();
  preview.add(model);
  const lens = new THREE.PerspectiveCamera(36, 1.4, 0.01, 10);
  lens.position.fromArray(observerDirection(galaxy)).multiplyScalar(1.6);
  lens.lookAt(0, 0, 0);
  renderer.setSize(112, 80, false);
  renderer.render(preview, lens);
  scene.add(model);
  const button = document.createElement('button');
  button.className = 'galaxy';
  button.dataset.galaxy = galaxy.id;
  button.setAttribute('aria-pressed', 'false');
  const image = new Image();
  image.alt = '';
  image.src = canvas.toDataURL();
  const name = document.createElement('span');
  name.textContent = galaxy.name;
  const classification = document.createElement('small');
  classification.textContent = galaxy.classification;
  name.append(classification);
  button.append(image, name);
  button.onclick = () => select(galaxy);
  element('#catalog').append(button);
  const label = document.createElement('button');
  label.className = 'map-label';
  label.textContent = galaxy.name;
  label.setAttribute('aria-label', 'Select ' + galaxy.name + ' on map');
  label.onclick = () => select(galaxy);
  const marker = document.createElement('span');
  marker.className = 'marker';
  const leader = document.createElementNS(svgNamespace, 'line');
  leaders.append(leader);
  labels.append(marker, label);
  const displacement = new THREE.Vector3(...positionAt(galaxy, timeLimitMyr)).sub(
    new THREE.Vector3(...positionAt(galaxy, 0)),
  );
  let arrow: THREE.ArrowHelper | undefined;
  const length = displacement.length();
  if (length > 0) {
    arrow = new THREE.ArrowHelper(displacement.normalize(), model.position, length, 0x76dabf, length * 0.23, length * 0.12);
    vectors.add(arrow);
  }
  return { galaxy, model, button, label, marker, leader, arrow, labelWidth: 0 };
});
let labelOrder = entries;
element('#catalog-count').textContent = String(entries.length);
const search = element<HTMLInputElement>('#catalog-search');
search.oninput = () => {
  const term = search.value.trim().toLowerCase();
  let count = 0;
  entries.forEach(({ galaxy, button }) => {
    button.hidden = !galaxy.name.toLowerCase().includes(term);
    if (!button.hidden) count++;
  });
  element('#catalog-count').textContent = term ? count + ' / ' + entries.length : String(count);
  element('#no-results').hidden = count > 0;
};
const starCanvas = document.createElement('canvas');
starCanvas.setAttribute('aria-hidden', 'true');
starCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
canvas.before(starCanvas);
function drawSky(width: number, height: number) {
  starCanvas.width = width;
  starCanvas.height = height;
  const context = starCanvas.getContext('2d')!;
  let seed = 3951;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < width * height / 1150; i++) {
    const x = random() * width, y = random() * height, power = random();
    context.fillStyle = 'rgba(194,215,237,' + (0.16 + power ** 4 * 0.55) + ')';
    context.beginPath();
    context.arc(x, y, 0.35 + power ** 4 * 0.75, 0, Math.PI * 2);
    context.fill();
  }
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
function setMode(value: typeof mode) {
  mode = value;
  sceneDirty = true;
  if (value === 'flight' || value === 'orbit') view = value === 'orbit' ? 'galaxy' : 'flight';
  element('#mode').textContent = {overview: 'Overview', orbit: 'Orbit', flight: 'Free flight'}[value];
  element('#view-name').textContent = value === 'orbit' ? selected!.name : view === 'mw-satellites' ? 'Milky Way satellites' : 'Local Group';
  controls.enableRotate = value !== 'flight';
}
function updatePositions() {
  const separation = Number(separationSlider.value);
  const previous = selected && models.get(selected.id)!.position.clone();
  const previousPlane = plane.grid.quaternion.clone();
  for (const { galaxy, model, arrow } of entries) {
    model.position.fromArray(positionAt(galaxy, timeMyr, separation));
    model.children[0].rotation.z = spinAt(galaxy, timeMyr);
    if (arrow) {
      arrow.position.copy(model.position);
      arrow.scale.setScalar(separation);
    }
  }
  plane.update(models.get('milky-way')!.position, models.get('andromeda')!.position, models.get('triangulum')!.position);
  if (mode === 'orbit' && selected && previous) {
    const shift = models.get(selected.id)!.position.clone().sub(previous);
    camera.position.add(shift);
    controls.target.add(shift);
  } else if (mode === 'overview' && centerOnPlane) {
    // Keep the viewing angle relative to the evolving plane, including a user's orbit.
    const change = plane.grid.quaternion.clone().multiply(previousPlane.invert());
    camera.position.applyQuaternion(change);
    controls.target.applyQuaternion(change);
  }
  sceneDirty = true;
}
function updateScale() {
  const size = Number(sizeSlider.value);
  const logarithmic = logSizeButton.getAttribute('aria-pressed') === 'true';
  for (const { galaxy, model } of entries) {
    const diameter = logarithmic ? logarithmicDiameter(galaxy.diameterKpc, largestDiameterKpc) : galaxy.diameterKpc;
    model.scale.setScalar(diameter * size);
  }
  updatePositions();
  if (mode === 'overview') refitGroup();
  element('#size-value').textContent = size + '×';
  element('#separation-value').textContent = separationSlider.value + '×';
}
function setPlayback(direction: typeof playback) {
  playback = direction;
  element('#play-forward').setAttribute('aria-pressed', String(playback === 1));
  element('#play-backward').setAttribute('aria-pressed', String(playback === -1));
  element('#pause-time').setAttribute('aria-pressed', String(playback === 0));
}
function setTime(value: number) {
  timeMyr = THREE.MathUtils.clamp(value, -timeLimitMyr, timeLimitMyr);
  if ((timeMyr === timeLimitMyr && playback === 1) || (timeMyr === -timeLimitMyr && playback === -1)) setPlayback(0);
  timeSlider.value = String(timeMyr);
  const epochLabel = timeMyr === 0 ? 'Present day'
    : Math.abs(timeMyr).toFixed(2) + ' Myr ' + (timeMyr < 0 ? 'ago' : 'ahead');
  epoch.value = epochLabel;
  timeSlider.setAttribute('aria-valuetext', epochLabel);
  updatePositions();
}
function play(direction: -1 | 1) {
  if (direction * timeMyr < timeLimitMyr) setPlayback(direction);
}
element('#play-backward').onclick = () => play(-1);
element('#play-forward').onclick = () => play(1);
element('#pause-time').onclick = () => setPlayback(0);
element('#reset-time').onclick = () => { setPlayback(0); setTime(0); };
timeSlider.oninput = () => { setPlayback(0); setTime(Number(timeSlider.value)); };
function overview(satellites = false) {
  view = satellites ? 'mw-satellites' : 'group';
  setMode('overview');
  const origin = models.get('milky-way')!.position;
  const axis = models.get('andromeda')!.position.clone().sub(origin).normalize();
  const upward = new THREE.Vector3(0,1,0);
  const sight = axis.clone().cross(upward).normalize().addScaledVector(upward,0.38).normalize();
  fitGroup(sight, upward, false);
}
function viewPlane(edgeOn: boolean) {
  view = edgeOn ? 'plane-edge' : 'plane-top';
  setMode('overview');
  showPlane.checked = plane.grid.visible = true;
  const sight = edgeOn ? plane.across : plane.normal;
  const up = edgeOn ? plane.normal : plane.across.clone().negate();
  fitGroup(sight, up, true);
  canvas.focus({preventScroll:true});
}
let centerOnPlane = false;
function refitGroup() {
  const sight = camera.position.clone().sub(controls.target).normalize();
  fitGroup(sight, camera.up, centerOnPlane);
}
function fitGroup(sight: THREE.Vector3, upward: THREE.Vector3, anchorOnPlane: boolean) {
  centerOnPlane = anchorOnPlane;
  setCameraUp(upward);
  camera.position.copy(sight);
  camera.lookAt(0,0,0);
  const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  // Fit the physical extents in camera coordinates for the current aspect ratio.
  const bounds = new THREE.Box3();
  entries.forEach(({galaxy, model}) => {
    if (view === 'mw-satellites' && galaxy.id !== 'milky-way' && galaxy.hostId !== 'milky-way') return;
    const radius = model.scale.x / 2;
    const center = new THREE.Vector3(model.position.dot(right), model.position.dot(up), model.position.dot(sight));
    bounds.expandByPoint(center.clone().addScalar(radius));
    bounds.expandByPoint(center.clone().subScalar(radius));
  });
  const center = bounds.getCenter(new THREE.Vector3());
  const extent = bounds.getSize(new THREE.Vector3());
  controls.target.copy(right).multiplyScalar(center.x).addScaledVector(up,center.y).addScaledVector(sight,center.z);
  // A perspective edge-on view requires the eye itself to lie in the reference plane.
  const offset = new THREE.Vector3();
  if (anchorOnPlane) {
    offset.copy(plane.normal).multiplyScalar(-controls.target.dot(plane.normal));
    controls.target.add(offset);
  }
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const halfWidth = extent.x / 2 + Math.abs(offset.dot(right));
  const halfHeight = extent.y / 2 + Math.abs(offset.dot(up));
  const distance = extent.z / 2 + Math.abs(offset.dot(sight)) + Math.max(halfWidth / camera.aspect, halfHeight) / tan * 1.36;
  camera.position.copy(controls.target).addScaledVector(sight,distance);
  controls.update();
}
function frame(edgeOn = false) {
  if (!selected) return;
  const model = models.get(selected.id)!;
  const direction = edgeOn ? new THREE.Vector3(1,0,0).applyQuaternion(model.quaternion)
    : new THREE.Vector3(...observerDirection(selected));
  controls.target.copy(model.position);
  setCameraUp(new THREE.Vector3(0,1,0));
  camera.position.copy(controls.target).addScaledVector(direction.normalize(), model.scale.x * 1.72 / Math.min(camera.aspect,1));
  setMode('orbit');
  controls.update();
  canvas.focus({preventScroll:true});
}
function select(galaxy: Galaxy) {
  if (mode === 'orbit' && selected !== galaxy) setMode('flight');
  selected = galaxy;
  sceneDirty = true;
  labelOrder = entries.filter(entry => entry.galaxy === selected).concat(entries.filter(entry => entry.galaxy !== selected));
  entries.forEach(entry => {
    entry.button.setAttribute('aria-pressed', String(entry.galaxy === galaxy));
    entry.label.classList.toggle('selected',entry.galaxy === galaxy);
  });
  const panel = element('#details');
  panel.hidden = false;
  panel.innerHTML = '<h2></h2><p class="measure"></p><div class="actions"><button>Frame galaxy</button><button>Observed view</button><button>Edge-on view</button></div><div class="motion"><p></p><p></p></div><details><summary>Model &amp; sources</summary><p></p><p></p><ul></ul></details>';
  panel.querySelector('h2')!.textContent = galaxy.name;
  const brightness = galaxy.absoluteMagnitudeV;
  panel.querySelector('.measure')!.textContent = 'Adopted diameter · ' + galaxy.diameterKpc.toLocaleString('en-US') + ' kpc'
    + ' · Catalog distance from Sun ' + galaxy.distanceKpc.toLocaleString('en-US') + ' kpc'
    + (brightness === undefined ? '' : ' · Absolute V magnitude ' + brightness);
  const motion = motionInfo(galaxy);
  const motionNotes = panel.querySelectorAll('.motion p');
  motionNotes[0].textContent = 'Center motion · ' + motion.translation;
  motionNotes[1].textContent = 'Internal rotation · ' + motion.rotation;
  const buttons = panel.querySelectorAll('button');
  buttons[0].onclick = buttons[1].onclick = () => frame();
  buttons[2].onclick = () => frame(true);
  const notes = panel.querySelectorAll('details p');
  notes[0].textContent = galaxy.sizeNote;
  notes[1].textContent = galaxy.modelNote;
  for (const source of [...galaxy.sources, ...motion.sources]) {
    const item = document.createElement('li'), link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.title;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    panel.querySelector('ul')!.append(item);
  }
}
element('#overview').onclick = () => overview();
element('#satellites').onclick = () => overview(true);
element('#plane-top').onclick = () => viewPlane(false);
element('#plane-edge').onclick = () => viewPlane(true);
logSizeButton.onclick = () => {
  const active = logSizeButton.getAttribute('aria-pressed') !== 'true';
  logSizeButton.setAttribute('aria-pressed', String(active));
  element('#log-size-note').hidden = !active;
  updateScale();
};
sizeSlider.oninput = separationSlider.oninput = updateScale;
const keys = new Set<string>();
const flightKeys = ['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE'];
window.addEventListener('keydown', event => {
  if (help.open || event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLInputElement) return;
  if (event.code === 'Home') {
    event.preventDefault();
    overview();
  } else if (flightKeys.includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
    setMode('flight');
  }
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
let originPointer: { x:number,y:number } | undefined;
canvas.addEventListener('pointerdown', e => {
  canvas.focus({preventScroll:true});
  canvas.setPointerCapture(e.pointerId);
  originPointer = {x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointermove', e => {
  if (!originPointer || mode !== 'flight' || !e.buttons) return;
  const radius = camera.position.distanceTo(controls.target);
  const direction = camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(camera.up, -e.movementX * 0.004);
  const right = direction.clone().cross(camera.up).normalize();
  const pitch = Math.asin(THREE.MathUtils.clamp(direction.dot(camera.up), -1, 1));
  const nextPitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.004, -1.55, 1.55);
  direction.applyAxisAngle(right, nextPitch - pitch);
  controls.target.copy(camera.position).addScaledVector(direction,radius);
  controls.update();
});
canvas.addEventListener('pointerup', e => {
  if (originPointer && Math.hypot(e.clientX-originPointer.x,e.clientY-originPointer.y) < 5) {
    const rect = canvas.getBoundingClientRect();
    const point = new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(point,camera);
    let closest: Galaxy | undefined, depth = Infinity;
    for (const {galaxy,model} of entries) {
      const hit = ray.ray.intersectSphere(new THREE.Sphere(model.position,model.scale.x/2),new THREE.Vector3());
      if (hit && camera.position.distanceTo(hit) < depth) {
        closest = galaxy;
        depth = camera.position.distanceTo(hit);
      }
    }
    if (closest) select(closest);
  }
  originPointer = undefined;
});
canvas.addEventListener('pointercancel', () => { originPointer = undefined; });
function fly(delta: number) {
  if (!keys.size || help.open) return;
  const v = new THREE.Vector3(
    Number(keys.has('KeyD')) - Number(keys.has('KeyA')),
    Number(keys.has('KeyE')) - Number(keys.has('KeyQ')),
    Number(keys.has('KeyS')) - Number(keys.has('KeyW'))
  ).normalize().applyQuaternion(camera.quaternion);
  const distance = Math.max(camera.position.distanceTo(controls.target),1);
  v.multiplyScalar(delta * distance * 0.72);
  camera.position.add(v);
  controls.target.add(v);
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w,h,false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  for (const entry of entries) entry.labelWidth = 0;
  drawSky(w,h);
  sceneDirty = true;
  if (mode === 'overview') refitGroup();
}
const projected = new THREE.Vector3();
function drawLabels() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const used: {x:number,y:number,w:number}[] = [];
  for (const entry of labelOrder) {
    const { galaxy, model, label, marker, leader } = entry;
    projected.copy(model.position).project(camera);
    const px = (projected.x+1)*width/2, py = (1-projected.y)*height/2;
    const hide = Math.abs(projected.z)>1 || px < 0 || px > width || py < 0 || py > height || (mode === 'orbit' && galaxy === selected);
    marker.hidden = hide;
    if (hide) {
      label.hidden = true;
      leader.style.display = 'none';
      continue;
    }
    marker.style.left = px+'px';
    marker.style.top = py+'px';
    if (!entry.labelWidth) {
      label.hidden = false;
      entry.labelWidth = label.offsetWidth;
    }
    const w = entry.labelWidth;
    const x = THREE.MathUtils.clamp(px + 12,2,width-w-2);
    // Keep crowded dwarfs as markers rather than drawing a stack of overlapping names.
    const offsets = [-20, 5, -45, 30, -70, 55, -95, 80];
    const y = offsets.map(offset => THREE.MathUtils.clamp(py + offset, 2, height - 26)).find(candidate =>
      used.every(other => x > other.x + other.w + 3 || x + w + 3 < other.x || Math.abs(candidate - other.y) >= 24));
    label.hidden = y === undefined;
    leader.style.display = y === undefined ? 'none' : '';
    if (y === undefined) continue;
    used.push({x,y,w});
    label.style.transform = 'translate('+x+'px,'+y+'px)';
    leader.setAttribute('x1',String(px)); leader.setAttribute('y1',String(py));
    leader.setAttribute('x2',String(THREE.MathUtils.clamp(px,x,x+w))); leader.setAttribute('y2',String(y+10));
  }
}
setPlayback(0);
updateScale();
overview();
resize();
new ResizeObserver(resize).observe(canvas.parentElement!);
const ruler = element('#distance');
let last = performance.now();
renderer.setAnimationLoop(now => {
  const elapsed = Math.max(0, (now - last) / 1000);
  if (playback) setTime(timeMyr + playback * elapsed);
  fly(Math.min(elapsed, 0.1));
  last = now;
  controls.update();
  if (!sceneDirty) return;
  sceneDirty = false;
  renderer.render(scene,camera);
  drawLabels();
  const kpc = 82 * 2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) / canvas.clientHeight;
  ruler.textContent = kpc.toLocaleString('en-US',{maximumSignificantDigits:2})+' kpc';
});
Object.assign(window,{
  explorerState: () => ({
    timeMyr, playback, view, velocityVectorsVisible: vectors.visible,
    planeNormal: plane.normal.toArray(), planeVisible: plane.grid.visible,
    spins: Object.fromEntries(entries.map(({galaxy, model}) => [galaxy.id, model.children[0].rotation.z])),
    selected: selected?.id ?? null, mode, camera: camera.position.toArray(), target: controls.target.toArray(),
    galaxies: Object.fromEntries(entries.map(({galaxy,model}) => [galaxy.id,{center:model.position.toArray(),diameter:model.scale.x}])),
    size:Number(sizeSlider.value),separation:Number(separationSlider.value)
  })
});
