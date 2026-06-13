# Analytics Invariants

These rules keep Pane's PostHog funnel person-stitchable and privacy-safe.

## Identity Comes First

Resolve analytics identity in the main process before the renderer captures any
consent event.

Required ordering:

1. Resolve GitHub CLI email, git email, or stable `install_id`.
2. Persist the analytics identity in config.
3. Capture `consent_dialog_shown`.
4. Capture `analytics_opted_in` or `analytics_opted_out`.
5. Capture `app_first_opened` and usage events only after the consent decision.

Do not let the app-level PostHog initializer flush queued usage while the
consent dialog is open. The consent dialog owns the first opt-in/opt-out flush.

## Required Event Context

Every first-run funnel event must include:

- `distinct_id`
- `install_id`
- `app_version`
- `platform`
- `analytics_identity_source`

The event should also set person properties when the identity is known:

- `email`
- `github_email`
- `git_email`
- `install_id`
- `app_version`
- `platform`

## Opt-Out Is Still Identified

Capture `analytics_opted_out` with identity context before disabling analytics.
After that capture, discard queued usage events and keep analytics disabled.

This records who opted out without sending their later product usage.

## Config Saves Preserve Analytics Fields

Renderer settings updates must deep-merge analytics config instead of replacing
it. In particular, do not drop:

- `identity`
- `installId`
- `attribution`
- `hasTrackedFirstOpen`
- `hasTrackedWebAttribution`

## Attribution and Versioning

When web attribution is present, emit attribution events with the same
`distinct_id` and `install_id` as consent and usage events.

App version should come from the running app context and be attached to consent,
first-open, usage, attribution, and close events. This lets PostHog distinguish
current users from older installs.

## Test Coverage

Changes to consent, analytics config, or first-run event ordering should update
or add coverage in:

- `main/src/services/analyticsIdentity.test.ts`
- `tests/analytics-consent.spec.ts`

The Playwright test should verify both event order and payload shape.
