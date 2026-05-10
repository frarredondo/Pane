import { execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as os from 'os';
import { getShellPath } from '../utils/shellPath';
import type { AnalyticsIdentity } from '../types/config';

function commandEnv(): NodeJS.ProcessEnv {
  return { ...process.env, PATH: getShellPath() };
}

function runCommand(command: string, args: string[]): string | undefined {
  try {
    const output = execFileSync(command, args, {
      cwd: os.homedir(),
      encoding: 'utf8',
      env: commandEnv(),
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
    return output.trim() || undefined;
  } catch {
    return undefined;
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function resolveAnalyticsIdentity(existingDistinctId?: string): AnalyticsIdentity {
  const githubUsername = runCommand('gh', ['api', 'user', '--jq', '.login']);
  const githubEmail = runCommand('gh', ['api', 'user', '--jq', '.email // empty']);
  const gitEmail = runCommand('git', ['config', '--global', 'user.email']);
  const gitUserName = runCommand('git', ['config', '--global', 'user.name']);
  const email = githubEmail || gitEmail;
  const gitEmailHash = email ? sha256(email) : undefined;

  let distinctId = existingDistinctId || `anon-${Date.now().toString(36)}`;
  let identitySource: AnalyticsIdentity['identitySource'] = existingDistinctId ? 'posthog' : 'anonymous';

  if (email) {
    distinctId = `email:${email.trim().toLowerCase()}`;
    identitySource = 'email';
  } else if (githubUsername) {
    distinctId = `github:${githubUsername}`;
    identitySource = 'github';
  } else if (gitUserName) {
    distinctId = `git_name:${gitUserName.trim().toLowerCase()}`;
    identitySource = 'git_name';
  }

  return {
    distinctId,
    identitySource,
    githubUsername,
    githubEmail,
    gitEmail,
    gitEmailHash,
    gitUserName,
  };
}
