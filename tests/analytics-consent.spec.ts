import { test, expect } from '@playwright/test';
import { installElectronApiMock } from './electronApiMock';

test('analytics consent dialog no longer exists; app loads straight through to the main UI', async ({ page }) => {
  await installElectronApiMock(page);

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await expect(page.getByText('Help Improve Pane')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'No thanks' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Enable analytics' })).not.toBeVisible();

  // Confirms no residual consent-gating state blocks the app from reaching its
  // normal startup-dialog sequencing (onboarding -> welcome/Discord -> main UI).
  const getStartedButton = page.locator('button:has-text("Get Started")');
  if (await getStartedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await getStartedButton.click();
  }
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible({ timeout: 10000 });
});
