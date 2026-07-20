import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

describe('analytics removal', () => {
  it('does not depend on posthog-js', () => {
    expect(packageJson.dependencies).not.toHaveProperty('posthog-js');
    expect(packageJson.devDependencies ?? {}).not.toHaveProperty('posthog-js');
  });
});
