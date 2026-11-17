import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { galaxies, type Galaxy } from './catalog';
import { placement, observerDirection } from './physics';
import { createGalaxyModel } from './models';
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
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.minDistance = 0.05;
controls.maxDistance = 16000;
const sizeSlider = element<HTMLInputElement>('#size');
const separationSlider = element<HTMLInputElement>('#separation');
let selected: Galaxy | undefined;
let mode: 'overview' | 'orbit' | 'flight' = 'overview';
const models = new Map(galaxies.map(galaxy => {
  const model = createGalaxyModel(galaxy);
  scene.add(model);
  return [galaxy.id, model] as const;
}));
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
  return { galaxy, model, button, label, marker, leader };
});
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
  element('#mode').textContent = {overview: 'Overview', orbit: 'Orbit', flight: 'Free flight'}[value];
  element('#view-name').textContent = value === 'orbit' ? selected!.name : 'Local Group';
  controls.enableRotate = value !== 'flight';
}
function updateScale() {
  const size = Number(sizeSlider.value), separation = Number(separationSlider.value);
  const previous = selected && models.get(selected.id)!.position.clone();
  entries.forEach(({ galaxy, model }) => {
    const { center, diameter } = placement(galaxy, size, separation);
    model.position.fromArray(center);
    model.scale.setScalar(diameter);
  });
  if (mode === 'orbit' && selected && previous) {
    const shift = models.get(selected.id)!.position.clone().sub(previous);
    camera.position.add(shift);
    controls.target.add(shift);
  }
  if (mode === 'overview') overview();
  element('#size-value').textContent = size + '×';
  element('#separation-value').textContent = separation + '×';
}
function overview() {
  setMode('overview');
  const origin = models.get('milky-way')!.position;
  const axis = models.get('andromeda')!.position.clone().sub(origin).normalize();
  const upward = new THREE.Vector3(0,1,0);
  const sight = axis.clone().cross(upward).normalize().addScaledVector(upward,0.38).normalize();
  camera.up.copy(upward);
  camera.position.copy(sight);
  camera.lookAt(0,0,0);
  const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  // Fit the physical extents in camera coordinates for the current aspect ratio.
  const bounds = new THREE.Box3();
  entries.forEach(({model}) => {
    const radius = model.scale.x / 2;
    const center = new THREE.Vector3(model.position.dot(right), model.position.dot(up), model.position.dot(sight));
    bounds.expandByPoint(center.clone().addScalar(radius));
    bounds.expandByPoint(center.clone().subScalar(radius));
  });
  const center = bounds.getCenter(new THREE.Vector3());
  const extent = bounds.getSize(new THREE.Vector3());
  controls.target.copy(right).multiplyScalar(center.x).addScaledVector(up,center.y).addScaledVector(sight,center.z);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const distance = extent.z / 2 + Math.max(extent.x / camera.aspect,extent.y) / (2*tan) * 1.36;
  camera.position.copy(controls.target).addScaledVector(sight,distance);
  controls.update();
}
function frame(edgeOn = false) {
  if (!selected) return;
  const model = models.get(selected.id)!;
  const direction = edgeOn ? new THREE.Vector3(1,0,0).applyQuaternion(model.quaternion)
    : new THREE.Vector3(...observerDirection(selected));
  controls.target.copy(model.position);
  camera.up.set(0,1,0);
  camera.position.copy(controls.target).addScaledVector(direction.normalize(), model.scale.x * 1.72 / Math.min(camera.aspect,1));
  setMode('orbit');
  controls.update();
  canvas.focus({preventScroll:true});
}
function select(galaxy: Galaxy) {
  if (mode === 'orbit' && selected !== galaxy) setMode('flight');
  selected = galaxy;
  entries.forEach(entry => {
    entry.button.setAttribute('aria-pressed', String(entry.galaxy === galaxy));
    entry.label.classList.toggle('selected',entry.galaxy === galaxy);
  });
  const panel = element('#details');
  panel.hidden = false;
  panel.innerHTML = '<h2></h2><p class="measure"></p><div class="actions"><button>Frame galaxy</button><button>Observed view</button><button>Edge-on view</button></div><details><summary>Model &amp; sources</summary><p></p><p></p><ul></ul></details>';
  panel.querySelector('h2')!.textContent = galaxy.name;
  panel.querySelector('.measure')!.textContent = 'Adopted diameter · ' + galaxy.diameterKpc.toLocaleString('en-US') + ' kpc';
  const buttons = panel.querySelectorAll('button');
  buttons[0].onclick = buttons[1].onclick = () => frame();
  buttons[2].onclick = () => frame(true);
  const notes = panel.querySelectorAll('details p');
  notes[0].textContent = galaxy.sizeNote;
  notes[1].textContent = galaxy.modelNote;
  for (const source of galaxy.sources) {
    const item = document.createElement('li'), link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.title;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    panel.querySelector('ul')!.append(item);
  }
}
element('#overview').onclick = overview;
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
  const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');
  rotation.y -= e.movementX * 0.004;
  rotation.x = THREE.MathUtils.clamp(rotation.x - e.movementY * 0.004,-1.55,1.55);
  const direction = new THREE.Vector3(0,0,-1).applyEuler(rotation);
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
  drawSky(w,h);
  if (mode === 'overview') overview();
}
const projected = new THREE.Vector3();
function drawLabels() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const used: {x:number,y:number,w:number}[] = [];
  for (const {galaxy,model,label,marker,leader} of entries) {
    projected.copy(model.position).project(camera);
    const px = (projected.x+1)*width/2, py = (1-projected.y)*height/2;
    const hide = Math.abs(projected.z)>1 || px < 0 || px > width || py < 0 || py > height || (mode === 'orbit' && galaxy === selected);
    label.hidden = marker.hidden = hide;
    leader.style.display = hide ? 'none' : '';
    if (hide) continue;
    const w = label.offsetWidth;
    const x = THREE.MathUtils.clamp(px + 12,2,width-w-2);
    let y = THREE.MathUtils.clamp(py - 19,2,height-26);
    for (let step = 0; step <= entries.length; step++) {
      if (!used.some(other => x < other.x+other.w+3 && x+w+3 > other.x && Math.abs(y-other.y)<25)) break;
      y = y + 25 < height - 26 ? y + 25 : Math.max(2,py - (step+2)*25);
    }
    used.push({x,y,w});
    label.style.transform = 'translate('+x+'px,'+y+'px)';
    marker.style.left = px+'px';
    marker.style.top = py+'px';
    leader.setAttribute('x1',String(px)); leader.setAttribute('y1',String(py));
    leader.setAttribute('x2',String(THREE.MathUtils.clamp(px,x,x+w))); leader.setAttribute('y2',String(y+10));
  }
}
updateScale();
resize();
new ResizeObserver(resize).observe(canvas.parentElement!);
const ruler = element('#distance');
let last = performance.now();
renderer.setAnimationLoop(now => {
  fly(Math.min((now-last)/1000,0.1));
  last = now;
  controls.update();
  renderer.render(scene,camera);
  drawLabels();
  const kpc = 82 * 2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) / canvas.clientHeight;
  ruler.textContent = kpc.toLocaleString('en-US',{maximumSignificantDigits:2})+' kpc';
});
Object.assign(window,{
  explorerState: () => ({
    selected: selected?.id ?? null, mode, camera: camera.position.toArray(), target: controls.target.toArray(),
    galaxies: Object.fromEntries(entries.map(({galaxy,model}) => [galaxy.id,{center:model.position.toArray(),diameter:model.scale.x}])),
    size:Number(sizeSlider.value),separation:Number(separationSlider.value)
  })
});
