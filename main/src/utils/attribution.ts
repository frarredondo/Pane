import type { AppConfig } from '../types/config';

/**
 * Git attribution environment variables.
 *
 * These are injected into ALL spawned processes (terminals, CLI tools, scripts)
 * so that any git commit made through Pane shows "committed by Pane" on GitHub.
 *
 * To get a clickable GitHub profile, create a GitHub user account (e.g. "runpane")
 * and use its noreply email: runpane@users.noreply.github.com
 */
export const GIT_ATTRIBUTION_ENV = {
  GIT_COMMITTER_NAME: 'Pane',
  GIT_COMMITTER_EMAIL: 'runpane@users.noreply.github.com',
};

/**
 * Returns GIT_ATTRIBUTION_ENV to inject into a spawned process/git command,
 * or {} when the user has turned the `gitAttributionEnabled` setting off.
 * Enabled by default (absent/undefined config is treated as enabled).
 */
export function getGitAttributionEnv(config: AppConfig | null | undefined): Record<string, string> {
  return config?.gitAttributionEnabled === false ? {} : GIT_ATTRIBUTION_ENV;
}
