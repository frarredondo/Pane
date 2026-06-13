import posthog from 'posthog-js';
import type { AnalyticsIdentity } from '../types/config';

const DEFAULT_API_KEY = 'phc_wir25CCsjr2NsZGEdlWNdvwcNG1XDjhxc9RyL5KDCf1';
const DEFAULT_HOST = 'https://runpane.com/api/c';

let currentApiKey: string | undefined;
let currentHost: string | undefined;
let currentEnabled: boolean | undefined;

export interface PendingAnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
}

let pendingEvents: PendingAnalyticsEvent[] = [];

export interface PostHogConfig {
  enabled: boolean;
  posthogApiKey?: string;
  posthogHost?: string;
  identity?: AnalyticsIdentity;
}

function identifyUser(config: PostHogConfig): void {
  if (!config.enabled || !config.identity) return;

  const properties = {
    identity_source: config.identity.identitySource,
    github_username: config.identity.githubUsername,
    github_email: config.identity.githubEmail,
    git_email: config.identity.gitEmail,
    git_email_sha256: config.identity.gitEmailHash,
    git_user_name: config.identity.gitUserName,
  };

  posthog.identify(config.identity.distinctId, Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  ));
}

function directCaptureTarget(): { token: string; host: string; distinctId: string } {
  const distinctId = posthog.get_distinct_id?.();

  return {
    token: currentApiKey || DEFAULT_API_KEY,
    host: currentHost || DEFAULT_HOST,
    distinctId:
      typeof distinctId === 'string' && distinctId.length > 0
        ? distinctId
        : `anon_${crypto.randomUUID()}`,
  };
}

export function initPostHog(config: PostHogConfig): void {
  const apiKey = config.posthogApiKey || DEFAULT_API_KEY;
  const host = config.posthogHost || DEFAULT_HOST;

  const needsInit = currentApiKey !== apiKey || currentHost !== host;

  if (needsInit) {
    posthog.init(apiKey, {
      api_host: host,
      // Restrict autocapture to interactive elements only — prevents capturing
      // sensitive text content (code, prompts) from non-interactive UI areas
      autocapture: {
        css_selector_allowlist: [
          'button',
          'a',
          '[role="button"]',
          '[role="tab"]',
          '[role="menuitem"]',
          'input[type="checkbox"]',
          'input[type="radio"]',
          'select',
        ],
      },
      capture_pageview: true,
      persistence: 'localStorage',
      opt_out_capturing_by_default: true,
    });

    currentApiKey = apiKey;
    currentHost = host;
  }

  // SDK already initialized with same key/host — just sync opt-in state.
  if (currentEnabled !== config.enabled) {
    if (config.enabled) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
    currentEnabled = config.enabled;
  }

  identifyUser(config);

  if (config.enabled) {
    flushPendingEvents();
  }
}

export function optIn(): void {
  posthog.opt_in_capturing();
}

export function optOut(): void {
  posthog.opt_out_capturing();
}

export function queuePendingEvent(event: PendingAnalyticsEvent): void {
  pendingEvents.push({
    eventName: event.eventName,
    properties: event.properties,
  });
}

export function flushPendingEvents(): void {
  const eventsToSend = pendingEvents;
  pendingEvents = [];

  for (const event of eventsToSend) {
    capture(event.eventName, event.properties);
  }
}

export function discardPendingEvents(): void {
  pendingEvents = [];
}

export function aliasWebVisitor(webDistinctId: string): void {
  try {
    posthog.alias(webDistinctId);
  } catch (error) {
    console.error('[PostHog] Failed to alias web visitor:', error);
  }
}

/**
 * Capture a single event and then opt out of capturing.
 *
 * Sends the event directly via HTTP instead of toggling the SDK's global
 * opt-in state, so no other events (autocapture, pageviews, etc.) can leak
 * during the flush window.
 */
export function captureAndOptOut(eventName: string, properties?: Record<string, unknown>): void {
  const { token, host, distinctId } = directCaptureTarget();

  const payload = {
    api_key: token,
    event: eventName,
    properties: {
      ...properties,
      distinct_id: distinctId,
      token,
      $lib: 'posthog-js',
      $process_person_profile: false,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.error('[PostHog] Failed to send opt-out event:', err);
    });
  } catch (error) {
    console.error('[PostHog] Failed to capture event:', error);
  }

  posthog.opt_out_capturing();
}

export function capture(eventName: string, properties?: Record<string, unknown>): void {
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('[PostHog] Failed to capture event:', error);
  }
}

/**
 * Capture a single event regardless of opt-in state, without toggling
 * opt-in afterward. Counterpart to captureAndOptOut: that one is for the
 * decline click; this one is for measurement events that need to fire
 * BEFORE the user has consented (e.g. consent_dialog_shown).
 *
 * Sends the event directly via HTTP so it bypasses the SDK's opt-in gate.
 * Same network path as captureAndOptOut, just without the opt-out flip.
 *
 * Use this sparingly. The only legitimate case is funnel-completeness
 * events that must be captured before the user can opt in or out —
 * specifically, "the user saw the consent dialog." It establishes the
 * real denominator for opt-in rate (versus the conservative
 * opted_in + opted_out lower bound).
 */
export function captureUnconditionally(eventName: string, properties?: Record<string, unknown>): void {
  const { token, host, distinctId } = directCaptureTarget();

  const payload = {
    api_key: token,
    event: eventName,
    properties: {
      ...properties,
      distinct_id: distinctId,
      token,
      $lib: 'posthog-js',
      $process_person_profile: false,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.error('[PostHog] Failed to send unconditional event:', err);
    });
  } catch (error) {
    console.error('[PostHog] Failed to capture event:', error);
  }
}

export { posthog };
