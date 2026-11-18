import { expect, test, type Page } from '@playwright/test';
import { Vector3 } from 'three';

interface SceneState {
  selected: string | null;
  mode: 'overview' | 'orbit' | 'flight';
  camera: number[];
  target: number[];
  galaxies: Record<string, { center: number[]; diameter: number }>;
  size: number;
  separation: number;
  planeVisible: boolean;
  timeMyr: number;
  playback: number;
  velocityVectorsVisible: boolean;
  view: string;
  spins: Record<string, number>;
  planeNormal: number[];
}

function readScene(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { explorerState(): SceneState }).explorerState(),
  );
}

function distance(a: number[], b: number[]) {
  return Math.hypot(...a.map((coordinate, i) => coordinate - b[i]));
}

async function openAtlas(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
}

async function setScale(page: Page, name: string, value: number) {
  const slider = page.getByRole('slider', { name, exact: true });
  await slider.focus();
  await slider.press('Home');
  const steps = await slider.evaluate((element, target) => {
    const input = element as HTMLInputElement;
    return Math.round((target - Number(input.min)) / Number(input.step));
  }, value);
  for (let i = 0; i < steps; i++) await slider.press('ArrowRight');
  await expect(slider).toHaveValue(String(value));
}

test('find, frame and orbit Andromeda, change both scales and return to the overview', async ({ page }) => {
  await openAtlas(page);
  const initial = await readScene(page);
  expect(initial.mode).toBe('overview');
  expect([initial.size, initial.separation]).toEqual([1, 1]);
  expect(Object.keys(initial.galaxies)).toEqual(expect.arrayContaining([
    'milky-way', 'andromeda', 'triangulum', 'large-magellanic-cloud', 'small-magellanic-cloud',
  ]));

  await page.locator('[data-galaxy="andromeda"]').first().click();
  await page.getByRole('button', { name: 'Frame galaxy', exact: true }).click();
  await expect.poll(async () => (await readScene(page)).mode).toBe('orbit');
  const framed = await readScene(page);
  expect(framed.selected).toBe('andromeda');
  expect(distance(framed.target, framed.galaxies.andromeda.center)).toBeLessThan(0.001);
  expect(distance(framed.camera, framed.target)).toBeLessThan(distance(initial.camera, framed.target));

  const box = (await page.locator('#sky').boundingBox())!;
  const x = box.x + box.width * 0.55;
  const y = box.y + box.height * 0.42;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 96, y + 25, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => distance((await readScene(page)).camera, framed.camera)).toBeGreaterThan(1);
  const orbited = await readScene(page);
  expect(distance(orbited.target, framed.target)).toBeLessThan(0.001);
  const orbitRadius = distance(orbited.camera, orbited.target);
  expect(orbitRadius).toBeCloseTo(distance(framed.camera, framed.target), 2);

  await page.mouse.wheel(0, -320);
  await expect.poll(async () => {
    const scene = await readScene(page);
    return distance(scene.camera, scene.target);
  }).toBeLessThan(orbitRadius);
  expect((await readScene(page)).galaxies).toEqual(initial.galaxies);

  await setScale(page, 'Galaxy size', 2);
  const enlarged = await readScene(page);
  await setScale(page, 'Galaxy separation', 0.5);
  const compressed = await readScene(page);
  for (const [id, galaxy] of Object.entries(initial.galaxies)) {
    expect(enlarged.galaxies[id].center).toEqual(galaxy.center);
    expect(enlarged.galaxies[id].diameter).toBeCloseTo(galaxy.diameter * 2);
    expect(compressed.galaxies[id].diameter).toBeCloseTo(enlarged.galaxies[id].diameter);
    compressed.galaxies[id].center.forEach((value, i) => expect(value).toBeCloseTo(galaxy.center[i] / 2));
  }

  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect.poll(async () => (await readScene(page)).mode).toBe('overview');
  const overview = await readScene(page);
  expect(distance(overview.camera, overview.target)).toBeGreaterThan(distance(compressed.camera, compressed.target));

  await setScale(page, 'Galaxy separation', 2);
  for (const name of ['Milky Way', 'Andromeda', 'Triangulum', 'Large Magellanic Cloud', 'Small Magellanic Cloud']) {
    await expect(page.getByRole('button', { name: `Select ${name} on map`, exact: true })).toBeInViewport();
  }
});

test('capture visible-light reconstructions for visual review', async ({ page }, testInfo) => {
  await openAtlas(page);
  for (const [id, view] of [
    ['andromeda', 'Observed view'],
    ['andromeda', 'Edge-on view'],
    ['large-magellanic-cloud', 'Observed view'],
    ['small-magellanic-cloud', 'Observed view'],
  ]) {
    await page.locator(`[data-galaxy="${id}"]`).first().click();
    await page.getByRole('button', { name: view, exact: true }).click();
    await expect.poll(async () => (await readScene(page)).mode).toBe('orbit');
    const name = `${id}-${view.split(' ')[0].toLowerCase()}.png`;
    const path = testInfo.outputPath(name);
    await page.screenshot({ path });
    await testInfo.attach(name, { path, contentType: 'image/png' });
  }
});

test('inspect the three-galaxy plane from above and edge-on, then orbit it', async ({ page }) => {
  await openAtlas(page);
  const initial = await readScene(page);
  const grid = page.getByRole('checkbox', { name: 'Show reference plane' });
  await expect(grid).not.toBeChecked();
  expect(initial.planeVisible).toBe(false);
  await grid.check();
  expect((await readScene(page)).planeVisible).toBe(true);
  await grid.uncheck();
  expect((await readScene(page)).planeVisible).toBe(false);

  const origin = new Vector3().fromArray(initial.galaxies['milky-way'].center);
  const toGalaxy = (id: string) => new Vector3().fromArray(initial.galaxies[id].center).sub(origin);
  const normal = toGalaxy('andromeda').cross(toGalaxy('triangulum')).normalize();
  const cameraDirection = (scene: SceneState) =>
    new Vector3().fromArray(scene.camera).sub(new Vector3().fromArray(scene.target)).normalize();

  await page.getByRole('button', { name: 'Top view', exact: true }).click();
  const top = await readScene(page);
  expect(top.planeVisible).toBe(true);
  expect(Math.abs(cameraDirection(top).dot(normal))).toBeCloseTo(1, 6);
  expect(top.galaxies).toEqual(initial.galaxies);

  await setScale(page, 'Galaxy separation', 0.5);
  const scaled = await readScene(page);
  expect(Math.abs(cameraDirection(scaled).dot(normal))).toBeCloseTo(1, 6);
  const largeCloud = 'large-magellanic-cloud';
  const height = new Vector3().fromArray(scaled.galaxies[largeCloud].center).sub(origin).dot(normal);
  expect(height).toBeCloseTo(toGalaxy(largeCloud).dot(normal) / 2, 6);

  await page.getByRole('button', { name: 'Edge-on plane view', exact: true }).click();
  const edge = await readScene(page);
  expect(cameraDirection(edge).dot(normal)).toBeCloseTo(0, 6);
  expect(new Vector3().fromArray(edge.camera).sub(origin).dot(normal)).toBeCloseTo(0, 4);

  const map = (await page.locator('#sky').boundingBox())!;
  const x = map.x + map.width * 0.6, y = map.y + map.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 32, y + 74, { steps: 4 });
  await page.mouse.up();
  const orbited = await readScene(page);
  expect(distance(orbited.camera, edge.camera)).toBeGreaterThan(1);
  expect(orbited.planeVisible).toBe(true);
  expect(orbited.galaxies).toEqual(edge.galaxies);
});

test('search the dwarf catalog and follow measured motion through time', async ({ page }) => {
  await openAtlas(page);
  const initial = await readScene(page);
  expect(initial.timeMyr).toBe(0);
  const search = page.locator('#catalog-search');
  await search.fill('Fornax');
  const match = page.locator('#catalog [data-galaxy]:visible');
  await expect(match).toHaveCount(1);
  await match.click();
  await expect(page.locator('#details h2')).toContainText('Fornax');
  await search.fill('');

  await page.locator('#satellites').click();
  expect((await readScene(page)).view).toBe('mw-satellites');
  await page.locator('#show-motion').check();
  expect((await readScene(page)).velocityVectorsVisible).toBe(true);
  const time = page.locator('#time');
  await time.focus();
  await time.press('End');
  const future = await readScene(page);
  expect(future.timeMyr).toBe(10);
  expect(future.galaxies['milky-way'].center).toEqual(initial.galaxies['milky-way'].center);
  expect(distance(future.galaxies.andromeda.center, initial.galaxies.andromeda.center)).toBeGreaterThan(0.1);
  expect(Math.abs(future.spins['milky-way'])).toBeGreaterThan(0.01);

  const atFuture = (id: string) => new Vector3().fromArray(future.galaxies[id].center);
  const normal = atFuture('andromeda').sub(atFuture('milky-way'))
    .cross(atFuture('triangulum').sub(atFuture('milky-way'))).normalize();
  expect(Math.abs(normal.dot(new Vector3().fromArray(future.planeNormal)))).toBeCloseTo(1, 8);

  await page.locator('#play-backward').click();
  await expect.poll(async () => (await readScene(page)).timeMyr).toBeLessThan(10);
  await page.locator('#pause-time').click();
  const paused = await readScene(page);
  expect(paused.playback).toBe(0);
  await page.locator('#reset-time').click();
  const reset = await readScene(page);
  expect(reset.timeMyr).toBe(0);
  expect(reset.galaxies).toEqual(initial.galaxies);
  expect(reset.spins).toEqual(initial.spins);
  await time.focus();
  await time.press('Home');
  expect((await readScene(page)).timeMyr).toBe(-10);
  await page.locator('#play-forward').click();
  await expect.poll(async () => (await readScene(page)).timeMyr).toBeGreaterThan(-10);
});

test('logarithmic sizes enlarge dwarf galaxies while preserving their centers', async ({ page }) => {
  await openAtlas(page);
  const physical = await readScene(page);
  const toggle = page.getByRole('button', { name: /logarithmic/i });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const compressed = await readScene(page);
  expect(compressed.galaxies.m32.diameter).toBeGreaterThan(physical.galaxies.m32.diameter * 2);
  expect(compressed.galaxies.andromeda.diameter).toBeCloseTo(physical.galaxies.andromeda.diameter);
  for (const [id, galaxy] of Object.entries(physical.galaxies)) {
    expect(compressed.galaxies[id].center).toEqual(galaxy.center);
  }
  await setScale(page, 'Galaxy size', 2);
  expect((await readScene(page)).galaxies.m32.diameter).toBeCloseTo(compressed.galaxies.m32.diameter * 2);
  await toggle.click();
  const restored = await readScene(page);
  for (const [id, galaxy] of Object.entries(physical.galaxies)) {
    expect(restored.galaxies[id].diameter).toBeCloseTo(galaxy.diameter * 2);
  }
});
