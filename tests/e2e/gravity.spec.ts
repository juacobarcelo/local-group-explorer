import { expect, test, type Page } from '@playwright/test';

interface GravityState {
  motionModel: string;
  timeMyr: number;
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
