# Remote PWA Safari Debug Handoff

## Goal

Root-cause why Remote Pane connects from Chrome but fails from Safari/iOS Safari. Safari matters because iPhone Home Screen PWA install uses Safari/WebKit.

Do not paste connection tokens into tickets, screenshots, or logs. When sharing output, redact `access_token`, `token`, and the full `pane-remote://...` code.

## Current Known State

- Preview app URL: `https://pane-remote-pwa-preview-sg622dpt4q-uc.a.run.app/app/?v=ca722cc`
- Current preview revision verified on Cloud Run: `pane-remote-pwa-preview-00011-t4c`
- Current preview JS bundle verified: `assets/remote-BwkHgECz.js`
- Chrome can connect with the same code.
- Safari/iOS Safari fails during connection or shortly after.
- Direct `/health` on the Tailscale host has been reachable from iPhone, sometimes slowly.
- Local curl from WSL to the Tailscale host returned CORS headers for `/health`, `OPTIONS /invoke`, and an unauthenticated `/events` error response:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Authorization, Content-Type, X-Pane-Remote-Runtime-Id, X-Pane-Remote-Client-Label, X-Pane-Client-Label, X-Pane-Client-Device-Label`

This points away from a simple missing CORS header and toward Safari-specific behavior in one of the browser transport steps.

## Code Path To Inspect

Primary client file:

- `frontend/src/remote/runtime/remoteDaemonBrowserClient.ts`

Connection sequence:

1. `connect()`
2. `checkHealth()` calls `fetch(<baseUrl>/health, { cache: 'no-store' })`
3. `openEventStream()` calls `fetch(<baseUrl>/events?...token...)`
4. `consumeEventStream()` reads `response.body.getReader()`
5. After connection, app state loads with POST `fetch(<baseUrl>/invoke, { method: 'POST', headers: { Content-Type: 'text/plain;charset=UTF-8' }, body: JSON.stringify(...) })`

Server file:

- `main/src/daemon/httpApiServer.ts`

Endpoints:

- `GET /health`
- `GET /events`
- `POST /invoke`
- `OPTIONS *`

Important detail: the app currently consumes SSE through streaming `fetch()` plus `ReadableStream.getReader()`, not native `EventSource`.

## Ranked Hypotheses

1. Safari accepts `/health` but fails or stalls on streaming `fetch()` for `/events`.
   - Evidence: code uses `response.body.getReader()` for a long-lived `text/event-stream`; Chrome works; Safari/iOS is the only failing browser.
   - Supporting references:
     - MDN documents `Response.body` as a `ReadableStream` and shows `getReader()` stream consumption.
     - MDN documents `EventSource` as the native browser API for receiving `text/event-stream` SSE.

2. Safari Home Screen PWA has different service-worker/storage/network behavior than Safari tab.
   - Need to compare Safari tab, Safari private/non-private, and Home Screen app with Web Inspector.

3. Safari blocks or mishandles the cross-origin POST `/invoke` even though CORS looks correct from curl.
   - Need Network tab evidence for preflight and POST.

4. Tailscale DNS/Tunnel readiness is slow on iOS Safari, causing the health or event connection to time out/abort.
   - User observed `/health` could take around 10 seconds earlier.

## Best Reproduction Setup

Physical iPhone is preferred because it exactly matches the failing PWA environment. iOS Simulator is still useful for quick Safari Web Inspector iteration, but if the simulator cannot reach the `.ts.net` host through the Mac's Tailscale routing, use the physical iPhone.

Requirements:

- Mac with Safari and Xcode installed.
- iPhone signed into the same Tailscale tailnet as the Pane host.
- Fresh `pane-remote://...` code from the current Pane nightly host.
- Preview URL above.
- Safari Develop menu enabled on macOS Safari.

Apple's docs say iOS/iPadOS pages, Home Screen web apps, service workers, and simulators can be inspected from Safari on a Mac. They also note Web Inspector is always enabled for simulators and booted simulators appear in Safari's Develop menu.

References:

- Apple: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios
- MDN `Response.body`: https://developer.mozilla.org/en-US/docs/Web/API/Response/body
- MDN `EventSource`: https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource

## Reproduction Steps

### Physical iPhone

1. On iPhone, open Settings > Apps > Safari > Advanced.
2. Enable Web Inspector.
3. Connect iPhone to Mac with a cable and trust the Mac when prompted.
4. On Mac Safari, enable Develop menu if needed: Safari > Settings > Advanced > Show features for web developers.
5. On iPhone Safari, open:
   - `https://pane-remote-pwa-preview-sg622dpt4q-uc.a.run.app/app/?v=ca722cc`
6. On Mac Safari, open Develop > iPhone > the preview URL.
7. Open Console and Network tabs.
8. Paste a fresh connection code into the iPhone page and tap connect.
9. Save screenshots or copied rows for:
   - Console error
   - `/health`
   - `/events`
   - `/invoke`
   - Any preflight `OPTIONS`
10. Add the page to Home Screen and repeat from the installed web app:
    - With the Home Screen app in foreground, inspect it from Develop > iPhone > Home Screen Web Apps > preview URL.

### iOS Simulator

1. Install/open Xcode.
2. Launch an iPhone simulator.
3. Open Safari in the simulator.
4. Open the preview URL.
5. On Mac Safari, use Develop > Simulator > preview URL.
6. Repeat the same connection steps.
7. If `.ts.net` does not resolve or `/health` fails only in the simulator, switch to a physical iPhone.

## Network Evidence To Capture

For each request, capture:

- URL path, not full tokenized URL.
- HTTP status.
- Request method.
- Request headers:
  - `Origin`
  - `Access-Control-Request-Method`
  - `Access-Control-Request-Headers`
  - `Content-Type`
- Response headers:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`
  - `Content-Type`
  - `Cache-Control`
- Timing: DNS, connect, SSL, waiting, total.
- Whether Safari labels the request as blocked, cancelled, failed, or CORS error.

Expected shape:

- `/health`: `200`, JSON `{ "ok": true, "status": "ready", "transport": "http+sse" }`
- `/events`: `200`, `Content-Type: text/event-stream; charset=utf-8`, stays open, first event should be `ready`
- `/invoke`: `200`, JSON `{ "ok": true, "result": ... }`

## Console Probes

Run these in Web Inspector Console after importing the connection code. They read the saved profile from localStorage without printing the token.

### 1. Confirm Saved Profile

```js
const profiles = JSON.parse(localStorage.getItem('pane.remotePwa.savedProfiles') || '[]');
profiles.map((p) => ({
  id: p.id,
  label: p.label,
  baseUrl: p.baseUrl,
  transport: p.transport,
  hasToken: Boolean(p.token),
  tunnelKind: p.tunnel?.kind,
}));
```

### 2. Test Health

```js
const p = JSON.parse(localStorage.getItem('pane.remotePwa.savedProfiles') || '[]')[0];
const t0 = performance.now();
await fetch(`${p.baseUrl}/health`, { cache: 'no-store' })
  .then(async (r) => ({
    ok: r.ok,
    status: r.status,
    ms: Math.round(performance.now() - t0),
    headers: Object.fromEntries(r.headers.entries()),
    text: await r.text(),
  }))
  .catch((e) => ({ name: e.name, message: e.message, ms: Math.round(performance.now() - t0) }));
```

### 3. Test Streaming Fetch SSE

```js
const p = JSON.parse(localStorage.getItem('pane.remotePwa.savedProfiles') || '[]')[0];
const url = new URL(`${p.baseUrl}/events`);
url.searchParams.set('access_token', p.token);
url.searchParams.set('runtime_id', 'safari-fetch-debug');
url.searchParams.set('client_label', 'Safari fetch debug');

const ac = new AbortController();
setTimeout(() => ac.abort(), 12000);
const t0 = performance.now();
try {
  const r = await fetch(url.toString(), { signal: ac.signal });
  console.log('fetch events response', {
    ok: r.ok,
    status: r.status,
    ms: Math.round(performance.now() - t0),
    contentType: r.headers.get('content-type'),
    hasBody: Boolean(r.body),
    getReaderType: typeof r.body?.getReader,
  });
  const reader = r.body?.getReader();
  const decoder = new TextDecoder();
  const first = await reader.read();
  console.log('fetch events first chunk', {
    done: first.done,
    text: first.value ? decoder.decode(first.value) : null,
    ms: Math.round(performance.now() - t0),
  });
  reader.releaseLock();
} catch (e) {
  console.log('fetch events error', {
    name: e.name,
    message: e.message,
    ms: Math.round(performance.now() - t0),
  });
}
```

### 4. Test Native EventSource SSE

```js
const p = JSON.parse(localStorage.getItem('pane.remotePwa.savedProfiles') || '[]')[0];
const url = new URL(`${p.baseUrl}/events`);
url.searchParams.set('access_token', p.token);
url.searchParams.set('runtime_id', 'safari-eventsource-debug');
url.searchParams.set('client_label', 'Safari EventSource debug');

const t0 = performance.now();
const es = new EventSource(url.toString());
es.addEventListener('open', () => console.log('eventsource open', Math.round(performance.now() - t0)));
es.addEventListener('ready', (event) => console.log('eventsource ready', Math.round(performance.now() - t0), event.data));
es.addEventListener('heartbeat', (event) => console.log('eventsource heartbeat', Math.round(performance.now() - t0), event.data));
es.onerror = (event) => console.log('eventsource error', Math.round(performance.now() - t0), event);
setTimeout(() => {
  es.close();
  console.log('eventsource closed');
}, 15000);
```

### 5. Test Invoke POST

```js
const p = JSON.parse(localStorage.getItem('pane.remotePwa.savedProfiles') || '[]')[0];
const t0 = performance.now();
await fetch(`${p.baseUrl}/invoke`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  body: JSON.stringify({
    channel: 'sessions:get-all-with-projects',
    args: [],
    token: p.token,
    runtimeId: 'safari-invoke-debug',
    clientLabel: 'Safari invoke debug',
  }),
})
  .then(async (r) => ({
    ok: r.ok,
    status: r.status,
    ms: Math.round(performance.now() - t0),
    headers: Object.fromEntries(r.headers.entries()),
    text: (await r.text()).slice(0, 1000),
  }))
  .catch((e) => ({ name: e.name, message: e.message, ms: Math.round(performance.now() - t0) }));
```

## Decision Matrix

Use this to identify the root cause quickly.

| Result | Likely Cause | Next Fix |
| --- | --- | --- |
| `/health` fails in Safari and Chrome works | iOS/Tailscale/DNS/TLS path | Capture Safari Network error and Tailscale state; not a PWA app bug yet |
| `/health` passes, streaming `fetch /events` fails, `EventSource /events` works | Safari streaming `fetch` incompatibility | Change PWA client SSE transport from streaming fetch to native `EventSource` |
| `/health` passes, both `fetch /events` and `EventSource /events` fail | SSE endpoint/header/proxy behavior incompatible with Safari | Compare `/events` response headers/timing; consider server header changes or heartbeat priming |
| `/events` works, `/invoke` fails | POST/CORS/body handling issue | Capture preflight and POST headers/status; adjust server/client request shape |
| Safari tab works, Home Screen PWA fails | PWA/service-worker/storage mode issue | Inspect Home Screen Web App and service worker separately; clear web app data and compare storage |

## Useful Local Commands

Run from any machine that has Tailscale access to the host. Redact tokens before sharing output.

```bash
curl -sS -D - -o /tmp/pane-health.txt \
  -H 'Origin: https://pane-remote-pwa-preview-sg622dpt4q-uc.a.run.app' \
  '<BASE_URL>/health'
```

```bash
curl -sS -D - -o /tmp/pane-options.txt \
  -X OPTIONS \
  -H 'Origin: https://pane-remote-pwa-preview-sg622dpt4q-uc.a.run.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  '<BASE_URL>/invoke'
```

## What To Send Back

Send:

- Browser and OS version.
- Safari tab vs Home Screen PWA result.
- Physical iPhone vs simulator result.
- Redacted Network rows for `/health`, `/events`, `/invoke`, and `OPTIONS`.
- Console output from the five probes above.
- Whether native `EventSource` works when streaming `fetch` fails.

Do not send:

- Full `pane-remote://...` code.
- `access_token` query string.
- `token` body value.
