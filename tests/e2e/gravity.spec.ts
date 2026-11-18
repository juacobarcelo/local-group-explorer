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

test('compare relative motion of seven galaxies and turn their dark halos on and off', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  const catalog = await readScene(page);
  const lmc = 'large-magellanic-cloud';
  const clock = page.locator('#time');
  const mode = page.locator('.timeline #motion-model');
  await expect(mode).toBeInViewport();
  await clock.focus();
  await clock.press('End');
  const linear = await readScene(page);
  const linearEnd = linear.galaxies[lmc].center.map((p, i) =>
    catalog.galaxies[lmc].center[i] + (p - catalog.galaxies[lmc].center[i]) * (2000 / linear.timeMyr));
  await page.locator('#reset-time').click();
  await mode.selectOption('gravity');
  const today = await readScene(page);
  const ids = ['milky-way', 'large-magellanic-cloud', 'small-magellanic-cloud', 'andromeda', 'triangulum', 'draco', 'fornax'];
  expect(Object.keys(today.galaxies).sort()).toEqual([...ids].sort());
  expect(today.darkHalosVisible).toBe(true);
  const distanceReadout = page.locator('#gravity-separation');
  await expect(distanceReadout).toBeVisible();
  const todaysDistance = await distanceReadout.innerText();
  expect(today.comparePaths).toBe(true);
  for (const id of ids) expect(today.galaxies[id].center).toEqual(catalog.galaxies[id].center);

  await clock.focus();
  await clock.press('End');
  const future = await readScene(page);
  expect(future.timeMyr).toBe(2000);
  await expect(distanceReadout).not.toHaveText(todaysDistance);
  const separationKpc = (state: GravityState, first: string, second: string) =>
    new Vector3().fromArray(state.galaxies[first].center).distanceTo(new Vector3().fromArray(state.galaxies[second].center));
  for (const [first, second] of [['milky-way', 'andromeda'], ['andromeda', 'triangulum'], ['milky-way', 'draco'], ['milky-way', 'fornax']]) {
    expect(Math.abs(separationKpc(future, first, second) - separationKpc(today, first, second))).toBeGreaterThan(1);
  }
  const differenceKpc = Math.hypot(...future.galaxies[lmc].center.map((p, i) => p - linearEnd[i]));
  expect(differenceKpc).toBeGreaterThan(1);
  expect(future.galaxies['milky-way'].center).toEqual([0, 0, 0]);

  const sky = page.locator('#sky');
  await page.locator('#dark-halos').uncheck();
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
  await clock.press('Home');
  expect((await readScene(page)).timeMyr).toBe(-2000);
  await page.locator('#reset-time').click();
  const reset = await readScene(page);
  expect(reset.galaxies).toEqual(today.galaxies);
  await page.locator('#motion-model').selectOption('linear');
  expect((await readScene(page)).galaxies).toEqual(catalog.galaxies);
});

test('inspect the measured interior mass and modeled dark halo of each new satellite', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  await page.locator('#motion-model').selectOption('gravity');
  const details = page.locator('#details');
  for (const [id, enclosedMass, radius] of [['draco', '21.1 million', 291], ['fornax', '73.9 million', 944]]) {
    await page.locator(`#catalog [data-galaxy="${id}"]`).click();
    await expect(details.locator('.enclosed-mass')).toContainText(`${enclosedMass} solar masses inside ${radius} pc`);
    await expect(details.locator('.motion')).toContainText('Extrapolated total dark halo');
    await details.locator('summary').click();
    await expect(details.getByRole('link', { name: /Wolf/i })).toBeVisible();
  }
});

test('fit the Milky Way, Andromeda and Triangulum halos in the group overview', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  await page.locator('#motion-model').selectOption('gravity');
  await page.locator('#dark-halos').uncheck();
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
  const sky = (await page.locator('#sky').boundingBox())!;
  for (const [id, name] of [['milky-way', 'Milky Way'], ['andromeda', 'Andromeda'], ['triangulum', 'Triangulum']]) {
    const depth = new Vector3().fromArray(state.galaxies[id].center).sub(eye).dot(sight);
    const radiusPx = 3 * state.haloRadii[id] * sky.height / (2 * depth * Math.tan(21 * Math.PI / 180));
    const center = await page.getByRole('button', { name: 'Select ' + name + ' on map', includeHidden: true, exact: true })
      .evaluate(label => {
        const marker = label.previousElementSibling!.getBoundingClientRect();
        return { x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 };
      });
    expect(center.x - radiusPx).toBeGreaterThanOrEqual(sky.x);
    expect(center.y - radiusPx).toBeGreaterThanOrEqual(sky.y);
    expect(center.x + radiusPx).toBeLessThanOrEqual(sky.x + sky.width);
    expect(center.y + radiusPx).toBeLessThanOrEqual(sky.y + sky.height);
  }
});
