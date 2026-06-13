# Playwright Testing Notes

Pane's Playwright configs start the Electron dev app and wait for the Vite
server before running tests.

Default local port:

```bash
pnpm test -- tests/smoke.spec.ts
```

Use a different port when another Playwright run or dev app is already using
`4521`:

```bash
PLAYWRIGHT_PORT=4522 pnpm test -- tests/analytics-consent.spec.ts
```

Do not run two Playwright commands concurrently against the same port. The
second run can attach to or interrupt the first run's dev server and produce
false failures such as `ERR_CONNECTION_REFUSED`.

CI uses:

```bash
pnpm test:ci:minimal
```

That command runs the maintained smoke and health checks through
`playwright.ci.minimal.config.ts`.
