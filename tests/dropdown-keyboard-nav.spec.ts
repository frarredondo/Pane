import { test, expect, Page } from '@playwright/test';
import { installElectronApiMock } from './electronApiMock';

test.beforeEach(async ({ page }) => {
  await installElectronApiMock(page);
  // Pin a known starting theme so arrow-key movement is deterministic.
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light-rounded');
  });
});

async function dismissStartupDialogs(page: Page) {
  const analyticsDecline = page.locator('button:has-text("No thanks")');
  if (await analyticsDecline.isVisible({ timeout: 3000 }).catch(() => false)) {
    await analyticsDecline.click();
    await page.waitForTimeout(500);
  }
  const getStartedButton = page.locator('button:has-text("Get Started")');
  if (await getStartedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await getStartedButton.click();
    await page.waitForTimeout(500);
  }
}

async function clickDomNode(locator: ReturnType<Page['locator']>) {
  await locator.evaluate((node: HTMLElement) => node.click());
}

async function openSettings(page: Page) {
  const collapseSidebarButton = page.getByRole('button', { name: 'Collapse sidebar' });
  await expect(collapseSidebarButton).toBeVisible({ timeout: 5000 });
  await collapseSidebarButton.click();

  const settingsButton = page.getByRole('button', { name: 'Settings' }).first();
  await expect(settingsButton).toBeVisible({ timeout: 5000 });
  await clickDomNode(settingsButton);

  await expect(page.getByText('Pane Settings')).toBeVisible({ timeout: 5000 });
}

test.describe('Dropdown keyboard navigation', () => {
  test('theme dropdown is navigable with arrow keys and Enter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dismissStartupDialogs(page);
    await openSettings(page);

    // The Appearance section is expanded by default; open the theme dropdown.
    // Scope to the settings form: HomePage underneath also renders a theme picker.
    const trigger = page
      .locator('#settings-form [aria-haspopup="menu"]')
      .filter({ hasText: 'Light (rounded)' });
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 5000 });

    // On open, focus lands on the currently selected item (Light (rounded)).
    // The theme menu is single-select (it passes selectedId), so its items are radios.
    const focusedItem = page.locator('[role="menuitemradio"]:focus');
    await expect(focusedItem).toHaveText(/Light \(rounded\)/);

    // ArrowDown moves to the next item (Forge), ArrowUp moves back.
    await page.keyboard.press('ArrowDown');
    await expect(focusedItem).toHaveText(/Forge/);
    await page.keyboard.press('ArrowUp');
    await expect(focusedItem).toHaveText(/Light \(rounded\)/);

    // Navigate to Forge and select it with Enter.
    await page.keyboard.press('ArrowDown');
    await expect(focusedItem).toHaveText(/Forge/);
    await page.keyboard.press('Enter');

    // Menu closes and the theme is applied.
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(
      page.locator('#settings-form').getByText('Forge', { exact: true }),
    ).toBeVisible();
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.classList.contains('forge')),
    ).toBe(true);

    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });

  test('Escape closes the dropdown without changing the theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dismissStartupDialogs(page);
    await openSettings(page);

    const trigger = page
      .locator('#settings-form [aria-haspopup="menu"]')
      .filter({ hasText: 'Light (rounded)' });
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();

    await expect(page.getByRole('menu')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('ArrowDown'); // move highlight to Forge
    await page.keyboard.press('Escape');

    await expect(page.getByRole('menu')).toHaveCount(0);
    // Highlighting Forge then pressing Escape must NOT commit the theme:
    // the document still carries the original light-rounded theme classes.
    const themeClasses = await page.evaluate(() => ({
      forge: document.documentElement.classList.contains('forge'),
      lightRounded: document.documentElement.classList.contains('light-rounded'),
    }));
    expect(themeClasses.forge).toBe(false);
    expect(themeClasses.lightRounded).toBe(true);
  });
});
