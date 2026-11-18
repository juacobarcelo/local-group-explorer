import { expect, test, type Page } from '@playwright/test';
import { Vector3 } from 'three';

interface GravityState {
  motionModel: string;
  timeMyr: number;
  camera: number[];
  target: number[];
  darkHalosVisible: boolean;
  comparePaths: boolean;
  haloRadii: Record<string, number>;
  galaxies: Record<string, { center: number[]; diameter: number }>;
}

function readScene(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { explorerState(): GravityState }).explorerState(),
  );
}

test('compare the Magellanic orbits and turn the dark halos on and off', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  const catalog = await readScene(page);
  const lmc = 'large-magellanic-cloud';
  const clock = page.locator('#time');
  await clock.focus();
  await clock.press('End');
  const linear = await readScene(page);
  const linearEnd = linear.galaxies[lmc].center.map((p, i) =>
    catalog.galaxies[lmc].center[i] + (p - catalog.galaxies[lmc].center[i]) * (500 / linear.timeMyr));
  await page.locator('#reset-time').click();
  await page.locator('#motion-model').selectOption('gravity');
  const today = await readScene(page);
  const ids = ['milky-way', 'large-magellanic-cloud', 'small-magellanic-cloud'];
  expect(Object.keys(today.galaxies).sort()).toEqual([...ids].sort());
  expect(today.darkHalosVisible).toBe(false);
  expect(today.comparePaths).toBe(true);
  for (const id of ids) expect(today.galaxies[id].center).toEqual(catalog.galaxies[id].center);

  await clock.focus();
  await clock.press('End');
  const future = await readScene(page);
  expect(future.timeMyr).toBe(500);
  const differenceKpc = Math.hypot(...future.galaxies[lmc].center.map((p, i) => p - linearEnd[i]));
  expect(differenceKpc).toBeGreaterThan(1);
  expect(future.galaxies['milky-way'].center).toEqual([0, 0, 0]);

  const sky = page.locator('#sky');
  const withoutHalos = await sky.screenshot({ path: info.outputPath('gravity-paths.png') });
  await page.locator('#dark-halos').check();
  const visible = await readScene(page);
  expect(visible.darkHalosVisible).toBe(true);
  expect(visible.galaxies).toEqual(future.galaxies);
  for (const id of ids) expect(visible.haloRadii[id]).toBeGreaterThan(0);
  const withHalos = await sky.screenshot({ path: info.outputPath('gravity-halos.png') });
  expect(withHalos.equals(withoutHalos)).toBe(false);

  await page.locator('#compare-paths').uncheck();
  expect((await readScene(page)).comparePaths).toBe(false);
  await page.locator('#dark-halos').uncheck();
  expect((await readScene(page)).darkHalosVisible).toBe(false);
  await page.locator('#reset-time').click();
  const reset = await readScene(page);
  expect(reset.galaxies).toEqual(today.galaxies);
  await page.locator('#motion-model').selectOption('linear');
  expect((await readScene(page)).galaxies).toEqual(catalog.galaxies);
});

test('fit the full Milky Way halo when enabled in the group overview', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  await page.locator('#motion-model').selectOption('gravity');
  await page.locator('#compare-paths').uncheck();
  await page.locator('#overview').click();
  const before = await readScene(page);
  await page.locator('#compare-paths').check();
  const after = await readScene(page);
  const cameraDistance = (s: GravityState) => Math.hypot(...s.camera.map((x, i) => x - s.target[i]));
  expect(cameraDistance(after)).toBeGreaterThan(cameraDistance(before));
  await page.locator('#compare-paths').uncheck();
  await page.locator('#overview').click();
  await page.locator('#dark-halos').check();

  const state = await readScene(page);
  const eye = new Vector3().fromArray(state.camera);
  const sight = new Vector3().fromArray(state.target).sub(eye).normalize();
  const depth = new Vector3().fromArray(state.galaxies['milky-way'].center).sub(eye).dot(sight);
  const sky = (await page.locator('#sky').boundingBox())!;
  const radiusPx = 3 * state.haloRadii['milky-way'] * sky.height / (2 * depth * Math.tan(21 * Math.PI / 180));
  const center = await page.getByRole('button', { name: 'Select Milky Way on map', includeHidden: true })
    .evaluate(label => {
      const marker = label.previousElementSibling!.getBoundingClientRect();
      return { x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 };
    });
  expect(center.x - radiusPx).toBeGreaterThanOrEqual(sky.x);
  expect(center.y - radiusPx).toBeGreaterThanOrEqual(sky.y);
  expect(center.x + radiusPx).toBeLessThanOrEqual(sky.x + sky.width);
  expect(center.y + radiusPx).toBeLessThanOrEqual(sky.y + sky.height);
});
