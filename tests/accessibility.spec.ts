import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axeTest';
import { installElectronApiMock } from './electronApiMock';

const project = {
  id: 1,
  name: 'Accessibility fixture',
  path: '/tmp/accessibility-fixture',
  active: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const session = {
  id: 'accessibility-session',
  name: 'Accessibility pane',
  worktreePath: '/tmp/accessibility-fixture/accessibility-pane',
  prompt: 'Verify the accessible UI',
  status: 'stopped',
  createdAt: new Date(0).toISOString(),
  lastActivity: new Date(0).toISOString(),
  output: [],
  jsonMessages: [],
  isRunning: false,
  permissionMode: 'ignore',
  projectId: project.id,
  displayOrder: 0,
  isFavorite: false,
  toolType: 'none',
  archived: false,
};

const panels = [
  {
    id: 'accessibility-terminal',
    sessionId: session.id,
    type: 'terminal',
    title: 'Terminal',
    state: { isActive: true, hasBeenViewed: true, customState: { isInitialized: false } },
    metadata: {
      createdAt: new Date(0).toISOString(),
      lastActiveAt: new Date(0).toISOString(),
      position: 0,
      permanent: true,
    },
  },
  {
    id: 'accessibility-explorer',
    sessionId: session.id,
    type: 'explorer',
    title: 'Explorer',
    state: { isActive: false, hasBeenViewed: true },
    metadata: {
      createdAt: new Date(0).toISOString(),
      lastActiveAt: new Date(0).toISOString(),
      position: 1,
    },
  },
  {
    id: 'accessibility-dashboard',
    sessionId: session.id,
    type: 'dashboard',
    title: 'Dashboard',
    state: { isActive: false, hasBeenViewed: true },
    metadata: {
      createdAt: new Date(0).toISOString(),
      lastActiveAt: new Date(0).toISOString(),
      position: 2,
    },
  },
];

async function openDesktop(page: Page): Promise<void> {
  await installElectronApiMock(page, {
    initialProjects: [project],
    initialSessions: [session],
    initialPanels: panels,
    activeProjectId: project.id,
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(page.locator('[data-testid="sidebar"]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
}

test('Home and About are axe-clean and the modal contains and restores focus', async ({ page }) => {
  await openDesktop(page);
  await expectNoAxeViolations(page);

  const aboutButton = page.getByRole('button', { name: /About Pane version/i });
  await expect(aboutButton).toBeVisible();
  await aboutButton.focus();
  await aboutButton.click();

  const dialog = page.getByRole('dialog', { name: 'About Pane' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    document.activeElement?.closest('[role="dialog"]') !== null
  ))).toBe(true);

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => (
      document.activeElement?.closest('[role="dialog"]') !== null
    ))).toBe(true);
  }

  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(aboutButton).toBeFocused();

  const themeTrigger = page.getByRole('button', { name: /\(sharp\)|\(rounded\)|OLED|Dusk|Forge|Ember|Aurora|Night Owl|Terracotta/ }).last();
  await themeTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.locator('[role="menuitemradio"]:focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(themeTrigger).toBeFocused();
});

test('seeded Create Pane dialog is keyboard reachable and axe-clean', async ({ page }) => {
  await openDesktop(page);

  await page.getByRole('button', { name: /^Expand repository Accessibility fixture$/ }).click();
  const newPaneButton = page.getByRole('button', { name: /New (workspace|pane)/i }).first();
  await expect(newPaneButton).toBeVisible();
  await newPaneButton.click();

  const dialog = page.getByRole('dialog', { name: /New Pane in Accessibility fixture/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('combobox', { name: /Base Branch/i })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('seeded pane exposes separate compound actions and arrow-keyed panel tabs', async ({ page }) => {
  await openDesktop(page);

  await page.getByRole('button', { name: /^Expand repository Accessibility fixture$/ }).click();
  const paneButton = page.getByRole('button', { name: 'Accessibility pane', exact: true });
  await expect(paneButton).toBeVisible();
  const archiveButton = page.getByRole('button', { name: /Archive Accessibility pane/i });
  const pinButton = page.getByRole('button', { name: /Pin Accessibility pane/i });
  await expect(archiveButton).toBeAttached();
  await expect(pinButton).toBeAttached();
  await expect(paneButton.locator('button, a, [role="button"]')).toHaveCount(0);
  await paneButton.click();

  const explorerTab = page.getByRole('tab', { name: /^Explorer/ }).first();
  const dashboardTab = page.getByRole('tab', { name: /^Dashboard/ }).first();
  await expect(explorerTab).toHaveAttribute('aria-selected', 'true');
  await explorerTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(dashboardTab).toBeFocused();
  await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  const closeDashboard = page.getByRole('button', { name: 'Close Dashboard' });
  await expect(closeDashboard).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dashboardTab).toHaveCount(0);
  await expect(explorerTab).toBeFocused();

  await expectNoAxeViolations(page, { include: '.pane-session-shell' });
});

test('Pane Chat agent choice uses native radio semantics', async ({ page }) => {
  await openDesktop(page);

  await page.getByRole('button', { name: 'Pane Chat' }).click();
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(2);
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
  await radios.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(radios.nth(1)).toBeChecked();
  await expectNoAxeViolations(page, { include: '.pane-chat-shell' });
});

test('disconnected Remote Pane screen is axe-clean', async ({ page }) => {
  await page.goto('/remote.html', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Remote Pane' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /Connect with a code/i })).toBeVisible();
  await expectNoAxeViolations(page);
});
