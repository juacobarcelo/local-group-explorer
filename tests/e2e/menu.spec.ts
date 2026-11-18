import { expect, test } from '@playwright/test';

test('open the menu from a small map and restore the desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.goto('/');
  await page.waitForFunction(() => 'explorerState' in window);
  const button = page.getByRole('button', { name: 'Menu', exact: true });
  const sidebar = page.locator('#explorer-menu');
  await expect(button).toBeInViewport();
  await expect(sidebar).toBeHidden();
  await button.click();
  await expect(page.getByRole('heading', { name: /Galaxy catalog/ })).toBeInViewport();
  await page.locator('#motion-model').selectOption('gravity');
  await expect(page.locator('#dark-halos')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(sidebar).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(sidebar).toBeInViewport();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
});
