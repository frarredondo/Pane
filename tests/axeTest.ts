import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  return violations.map((violation) => {
    const targets = violation.nodes
      .map((node) => node.target.join(' > '))
      .join('\n    ');

    return [
      `${violation.id}: ${violation.help}`,
      `  ${violation.helpUrl}`,
      `  Targets:\n    ${targets}`,
    ].join('\n');
  }).join('\n\n');
}

export async function expectNoAxeViolations(
  page: Page,
  options: { include?: string } = {},
): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001ms !important;
        transition-delay: 0s !important;
        transition-duration: 0.001ms !important;
      }
    `,
  });
  await page.waitForTimeout(20);

  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (options.include) {
    builder = builder.include(options.include);
  }

  const results = await builder.analyze();
  expect(
    results.violations,
    `Expected no WCAG A/AA violations.\n\n${formatViolations(results.violations)}`,
  ).toEqual([]);
}
