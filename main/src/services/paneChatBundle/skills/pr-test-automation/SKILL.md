---
name: pr-test-automation
description: Run first-pass automated manual testing for PRs that are reviewed or nearly ready to merge. Use when the user asks you to test a PR, branch, or worktree, validate product flows, exercise browser or CLI workflows, map changed UI journeys with screenshots, verify analytics, webhook, payment, email, or SMS behavior through connected tools, or produce manual QA notes before human testing.
---

# PR test automation

Validate as much of a PR as you can with local services, browser automation,
CLIs, logs, and product connectors before the user does final manual testing.
This is first-pass QA: prove what works with evidence, identify what still
needs a human, and leave a reproducible trail.

## Before you start: preflight

QA evidence is current-head evidence, and the Manual tests checklist is the PR
body's contract. Anything that would change either runs first:

- On a large PR (over 10 files or 300 hand-written lines) that has not had a
  `refactor` pass, say so and offer one before driving anything. A refactor
  landed after QA means this whole pass runs again.
- Run `cold-read` on the PR body before QA, so the checklist you execute is the
  one the reader will see.

Then confirm the PR is testable. Pass the PR number or URL to every
`gh pr view` call; bare `gh pr view` uses the current branch's PR, which may
differ from the test target.

- **Mergeability.** Check `gh pr view <PR> --json mergeable,mergeStateStatus`.
  A conflicting PR may get no gating CI run, and its head will change on merge.
  If it conflicts, report blocked and stop before driving.
- **Head SHA incorporated.** Confirm the PR's `headRefOid` is in the tested
  state (`gh pr view <PR> --json headRefOid`). For companion PRs tested
  together, local HEAD may be a merge commit of several PR heads: check the
  target head is in the ancestry
  (`git merge-base --is-ancestor <headRefOid> HEAD`) and record the composite
  SHA. Evidence must come from the code the reviewer is looking at.
- **CI existence.** Check that at least one workflow run exists for the head
  commit (`gh run list --commit <headRefOid>`). If the repo has CI and no run
  registered, something is wrong (path filters, a conflicting state, a
  workflow syntax error). Note it as a finding.
- **Tools alive.** Verify every tool the run needs before the first long flow:
  authenticated CLIs, running services, connectors, test-mode keys. A flow
  that dies at step 7 on a missing login wastes the whole run.

## Workflow

1. Confirm the test target:
   - Identify PR numbers, branches, worktrees, related companion PRs, and
     whether the user allowed rebasing or syncing.
   - Check `git status`, the current branch, remotes, and any unrelated local
     changes.
   - Read PR descriptions and review notes that define required manual flows.

2. Check tools and authentication up front:
   - Verify required CLIs and connectors before long tests: `gh auth status`,
     `stripe --version` and active listener state, Docker status, PostHog,
     GitHub, or Gmail connectors, cloud CLIs, and app-specific CLIs. Confirm
     credentials are current.
   - Look for verification tools before deciding a check needs a human. If
     Composio is available, use `composio search` to find inbox, SMS or phone,
     payment, CRM, support, or provider-log tools, then inspect schemas with
     `--get-schema` before executing.
   - Prefer connected app tools for verifying product data.
   - Use test-mode accounts, test keys, local containers, and staging-safe
     endpoints unless the user explicitly asks for production verification.

3. Prepare the environment:
   - Install dependencies only where needed, and report anything that changes
     lockfiles.
   - Start required dev servers, or confirm existing sessions, ports, and
     mounted worktrees.
   - For companion PRs, test the combined state in the worktree or container
     that actually serves the code.
   - Keep one instance of each background listener or server. List and clean
     up only the processes you started for the test.

4. Build the automated test path:
   - Use Playwright when browser behavior matters. If the repo lacks it,
     install it in a temporary directory outside the repo.
   - Use stable, user-visible selectors first: labels, placeholders, button
     text, URLs, and route state.
   - Generate unique short test identities and attribution markers such as
     `agent-e2e-<timestamp>`.
   - When UI changes are in scope, map each touched surface and user journey
     to screenshots in an easy-to-find temporary folder such as
     `tmp/pr-<number>-qa/` or `tmp/<branch>-qa/`. Name files in journey order,
     such as `01-signup-account.png` and `02-dropdown-expanded.png`.
   - Capture the meaningful states along the way: empty or default, filled or
     selected, expanded menus, modals, validation errors, loading and success,
     and at least one narrow viewport when responsive layout may be affected.
   - Use the same screenshot pattern for local and dev validation and, when the
     user asks for post-merge production verification, for production. Keep
     local and production artifacts in separate folders or filenames.
   - When a scriptable browser driver runs a journey, record it as a video
     alongside the stills:
     - One video per journey, recorded at the driver level (for example
       Playwright's `recordVideo`), so it comes free with the drive.
     - Keep the driver's native format: WebM from a browser, MP4 from a
       simulator.
     - Videos add to the stills. Per-step captures stay the frame-addressable
       evidence; the video is the continuity check.
     - Where ffmpeg is available, scan for blank-frame bands
       (`ffprobe -f lavfi "movie=<video>,fps=5,signalstats" -show_entries frame=pts_time -show_entries frame_tags=lavfi.signalstats.YAVG`;
       YAVG ~235 is blank white). Report layout jumps, white flashes, and dead
       time as findings with timestamp ranges.
   - Prefer the app's built-in test or simulation path for external effects:
     local inboxes, Mailhog-style UIs, fake SMS numbers, test OTP logs, sandbox
     payment modes, webhook listeners, or provider test keys.
   - Parse email or SMS verification links and codes from container logs when
     the local environment emits them.
   - Add small human-paced waits around analytics and step transitions, so
     effects and batched events fire in the order a user would see them.

5. Verify externally as well as locally:
   - Network requests prove the browser tried to send data. Connector or API
     queries prove the product received it.
   - When simulation is unavailable, read back from the recipient or provider:
     - email: Gmail, Outlook, IMAP, or email-service activity
     - SMS and voice: Twilio, Dialpad, OpenPhone, Google Voice, test-number
       services, or provider logs
     - payments: Stripe or provider dashboards
   - Query by the unique marker, test email, phone number, org ID, subscription
     ID, webhook event ID, request ID, or another stable test value.
   - For webhooks, confirm both the CLI or listener output and the backend
     logs, then verify downstream data.
   - For analytics dashboards, query the exact project and state the date range
     and filters used.

6. Report results. Return what passed, what is still uncertain, the next check,
   and up to three improvements grounded in testing friction. Open with a
   verdict, then the evidence:

   ```
   Verdict: <all-proven | partial | blocked-env | blocked-auth | product-bug-found>

   | Journey / Check | Result | Evidence |
   |-----------------|--------|----------|
   | <flow or check> | Pass / Fail / Blocked / Left to human | <quoted output, screenshot ref, connector readback> |

   Skipped (with rationale):
   - <item>: <why it was skipped, not just "skipped">

   Cleanup disposition:
   | Created | Marker | System | Disposition |
   |---------|--------|--------|-------------|
   | <account, org, record> | <run marker> | <staging / analytics / billing> | deleted · registered (<why not safe>) · none created |
   ```

   A pass needs quoted evidence. "Blocked" is terminal: when a check can't be
   exercised (missing env, service down, no credentials), stop on it and
   report it blocked. Only the real test route produces evidence; an
   improvised workaround proves nothing.

   Terminal states and the human's next step:
   - `all-proven`: every check passed with evidence. Ready for human review.
   - `partial`: some checks passed and others are left to the human. List the
     gaps.
   - `blocked-env`: an environment issue (service down, container missing).
     Name the blocker.
   - `blocked-auth`: missing credentials or connector scopes. Name what is
     needed.
   - `blocked-timeout`: the wall clock expired first. List what finished and
     what remains.
   - `product-bug-found`: a check failed in the product. Describe the bug with
     evidence.

   Beyond the verdict, include:
   - the exact test identity or marker used for external queries
   - screenshot paths for changed UI, grouped by journey step, with the
     surface, environment, and UI state each covers
   - video paths for journey recordings, with duration and what each shows
   - connector and query evidence: event names, identifiers, timestamps, and
     key properties
   - each intentionally skipped item and why, one by one
   - artifacts of the test harness (mocked browser properties, prevented
     navigation, masked automation signals)

   Publish shareable screenshots and update the PR as described in
   [Durable PR QA](#durable-pr-qa-descriptions-comments-and-screenshots).

## PostHog and browser analytics

PostHog JavaScript drops capture events from likely bots. Headless Playwright
can still fetch PostHog config and run `identify`, while `capture` events are
silently dropped because `navigator.webdriver` is `true`, the user agent looks
automated, or `navigator.userAgentData.brands` includes `HeadlessChrome`.

When the explicit goal is to validate product analytics in local automation:

- Use a normal browser user agent.
- Mask only the automation signals, for this test context. Override
  `navigator.userAgentData` too; setting `userAgent` alone leaves headless
  Chrome visible there:

```js
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
})

await context.addInitScript(() => {
  const brands = [
    { brand: 'Chromium', version: '125' },
    { brand: 'Google Chrome', version: '125' },
    { brand: 'Not.A/Brand', version: '24' },
  ]
  const fullVersionList = brands.map((brand) => ({
    ...brand,
    version: `${brand.version}.0.0.0`,
  }))

  Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  Object.defineProperty(navigator, 'userAgentData', {
    get: () => ({
      brands,
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues: async () => ({
        brands,
        mobile: false,
        platform: 'Windows',
        architecture: 'x86',
        bitness: '64',
        model: '',
        uaFullVersion: '125.0.0.0',
        fullVersionList,
      }),
      toJSON: () => ({ brands, mobile: false, platform: 'Windows' }),
    }),
  })
})
```

- If the UI branches on OS or desktop versus mobile, set the platform signal
  on purpose and disclose it:

```js
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
})
```

- Keep the page open long enough for PostHog batching, or trigger an unload
  only after waiting.
- Query PostHog for the unique marker. Ingested capture events are the
  evidence; `flags` and config requests only show the SDK loaded.
- If event order looks wrong under automation, rerun with human-paced waits
  before calling it a product bug.

## Analytics identity verification

When a PR touches analytics, signup, login, or session handling, verify person
stitching as well as event ingestion:

- Group verification queries by `person_id`. Event-time `person.properties.*`
  differ per row, so an email-grouped check can pass while several QA users
  have merged into one person.
- When stitching looks wrong, inspect the raw `distinct_id` per event. It
  names the identity that captured the event and usually points straight at
  the merge vector.
- When the PR touches identity stitching itself (aliasing, identify calls,
  distinct-id or session-identity plumbing), or the product targets shared
  devices, run a **multi-user same-browser pass**:
  - several signups and login switches in one browser profile
  - assert each user resolved to a separate person
  - assert functional session state (websocket auth, cookies) followed each
    switch

  Single-user passes can't see shared-machine bugs such as identity merges or
  stale-socket auth. The pass is expensive, so reserve it for changes where
  that failure mode is in play.
- When a fix's re-verification still fails, suspect stacked causes: fix one
  vector, re-run the proof, and let the raw `distinct_id` data name the next.
- Test events fired just before hard navigations (checkout redirects, external
  scheduling links). SDK batching drops them on unload; they need per-capture
  `sendBeacon` transport. Prove it in the warehouse, where a dropped event is
  absent.

## Multi-surface attribution flows

Some PRs only work when a marketing site, API route, installer, desktop app,
or mobile client is tested as one product flow. When attribution or install
and download analytics cross those boundaries:

- Test companion PRs together in the worktree or preview environment that
  actually serves each surface.
- Validate route-level behavior directly before browser testing. For install
  and download flows, assert that fresh tokens are accepted, stale or
  malformed tokens are dropped, invalid files or inputs are rejected, and
  crawler-facing routes are excluded when needed.
- In browser clipboard tests, compare the visible UI text with the clipboard
  text. The visible command or link often stays clean while the copied value
  carries a hidden `ref`, `utm`, or attribution token.
- If client-side analytics must create a distinct ID but production capture
  is out of scope, use a dummy public key and intercept the analytics
  endpoints. If production verification is requested, use a unique marker and
  query the analytics project afterward.
- Use temporary app data directories for native app tests, so config
  migrations, attribution files, cookies, and local databases leave the
  user's real profile alone.
- In Electron, Tauri, React Native, or similar native-shell mocks, event
  subscription APIs must return cleanup functions. Promise-returning mocks for
  `on*` or `subscribe*` APIs cause false crashes that look like product
  regressions.
- Captures that fire before an analytics SDK finishes initializing need
  explicit host, token, and distinct-ID assertions. A request that falls back
  to the SDK vendor's default host before app config loads is usually a
  product bug.
- Cover the happy path and one negative path: accepted or refreshed
  attribution, stale or malformed attribution, user opt-in or opt-out, and any
  server-side invalid-input analytics.

## External integrations

For payment, email, SMS, analytics, and other third-party integrations:

- Confirm the account, project, and mode before running tests.
- Prefer test-mode objects and fake or test cards.
- When the PR's behavior depends on delivery, ingestion, webhook receipt, or
  downstream processing, get recipient- or provider-side evidence. A 200 from
  the app or provider only shows the send.
- Use plus-addresses, reserved fake phone numbers, sandbox identities,
  metadata, notes, UTM values, or request IDs, so every external artifact can
  be found without ambiguity.
- Respect production stop boundaries. Never bypass MFA, consume one-time
  tokens, send real calls or SMS, create paid subscriptions, charge cards, or
  mutate customer data without the user's explicit approval for that
  production action.
- Check for an existing listener before starting a webhook listener.
- Record the IDs that let the user or a future agent find the test again:
  email, phone number, org key, customer ID, subscription ID, message ID,
  webhook event type, dashboard URL, event marker, or screenshot path.
- If a provider key lacks read scopes, try another non-destructive readback:
  a connected mailbox, a recipient-side tool, a provider dashboard export, an
  app database row, a webhook table, logs, or an analytics event. Report the
  scope limitation as an environment limit.
- Never expose secrets in the final answer. Public analytics tokens differ
  from private API keys, but describe them carefully too.

## Durable PR QA descriptions, comments, and screenshots

When testing an open PR, put the result where reviewers look first.

### Collect and classify

- Create a local artifact folder such as `tmp/pr-<number>-qa/` with raw
  screenshots, scripts, the exact PR Markdown, and `pr-assets-manifest.json`.
- Classify every image before upload. Upload only what every PR reader may
  see. Keep local anything with PHI, secrets, private customer data, real
  inbox contents, payment details, MFA codes, or production admin data.
  Redact a copy only when you can verify the redaction visually.

### Publish to a repository release

- Use a repository-owned durable surface. For GitHub PRs, find and reuse a
  published, mutable, long-lived release such as `pr-assets` or the
  repository's documented equivalent. One release serves every PR. Use it in
  preference to any arbitrary temporary host:

  ```bash
  repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
  default_branch="$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)"
  gh release list -R "$repo" --limit 100 \
    --json tagName,name,isDraft,isPrerelease
  gh release view pr-assets -R "$repo" \
    --json tagName,isDraft,isPrerelease,isImmutable,url,assets
  ```

- If no suitable release exists, creating one long-lived `pr-assets` release
  is a separate hard stop. It needs an exact grant such as
  `{"action":"create_release","repo":"owner/name","tag":"pr-assets"}`; general
  GitHub, PR, comment, or upload authorization does not cover it. Target the
  default branch and keep it out of Latest-release semantics:

  ```bash
  gh release create pr-assets -R "$repo" --title "PR assets" \
    --notes "Long-lived image assets for pull requests and QA evidence." \
    --latest=false --target "$default_branch"
  ```

- If release creation or upload is not authorized, skip temporary hosts too.
  Write the intended filenames, the manifest, the exact `gh release create`
  and `gh release upload` commands, and ready-to-paste marked PR Markdown into
  the artifact folder, and report durable publication as blocked.
- Compute each source file's SHA-256 before upload. Name each asset with
  stable context plus content identity, for example
  `pr-<number>-<head-short-sha>-<content-sha12>-<step>.png`. Use a branch slug
  when there is no PR number yet. Sanitize names to portable lowercase ASCII.
- Make reruns idempotent. Inspect the release assets before uploading:
  - If the exact name exists and its GitHub digest matches the local file
    (or, with no digest, a downloaded byte-for-byte hash does), reuse its URL.
  - If the content differs, extend the hash or add a deterministic suffix and
    upload a new asset. Leave the existing asset untouched (no
    `gh release upload --clobber`), so older PRs keep their images.
- Upload with `gh release upload <tag> <path> -R "$repo"`, then read back the
  release and asset metadata. Require the intended tag, a non-draft release,
  uploaded asset state, the expected filename and size, the SHA-256 digest
  when GitHub supplies one, and `browser_download_url`.
- Download the uploaded bytes with a direct GET (authenticated through GitHub
  for private repositories); a HEAD request is insufficient. Compare the
  downloaded SHA-256 and size with the local source and check the decoded file
  type or image magic. An HTML login or error page behind a misleading status
  is a failure. Record the verification time and result.
- Keep `pr-assets-manifest.json` across reruns. For each asset record the
  repository, release tag and URL, PR number, head commit, source path,
  semantic step, asset name, local SHA-256 and size, asset API URL, browser
  download URL, upload-or-reuse status, timestamp, and verification result.
  Keep tokens, cookies, and sensitive test data out of it.

### Update the PR description

The PR description is the primary review surface. Append or replace only the
section between `<!-- pr-test-automation-summary:start -->` and
`<!-- pr-test-automation-summary:end -->`, leaving the human-written summary
as it is. If a legacy `<!-- codex-pr-test-automation-summary -->` section
exists, migrate it once. Keep the section compact:

- current QA status
- test account, org, and marker identifiers
- user journeys and surfaces tested
- key external evidence IDs, such as Stripe subscription IDs, email IDs,
  PostHog event names, webhook IDs, or database readback
- key screenshot previews, when UI review is central and the set is small
  enough to skim
- a link to the detailed QA comment or local artifacts when the evidence is
  long
- what remains for human review and what was intentionally skipped

### Post the detail comment

When evidence, logs, or screenshot galleries are too large for the
description, post or update one PR comment whose owned content sits between
`<!-- pr-test-automation-detail:start -->` and
`<!-- pr-test-automation-detail:end -->`. Recognize the legacy
`<!-- codex-pr-test-automation -->` marker so reruns update the older comment.
Include:

- a summary of the automated manual QA outcome
- test account, org, and marker identifiers
- user journeys and surfaces tested
- screenshot previews
- connector and provider evidence such as PostHog, Stripe, email, SMS, logs,
  or database readback
- what remains for human review and what was intentionally skipped

If PR commenting is not authorized or a connector is unavailable, write the
exact Markdown comment body into the artifact folder and report the path.

### Render screenshots inline

When UI changed, render safe uploaded screenshots inline so reviewers can skim
without opening each link. Use grouped preview galleries:

- one `<details open>` section per user journey or touched UI surface when
  there are many screenshots
- screenshots in chronological order, each labeled with the journey step and
  the state it proves
- one sentence per screenshot: what surface and state it shows, and what the
  reviewer should notice
- a two-column Markdown or HTML table when there are more than four
  screenshots
- direct image URLs in Markdown image syntax or `<img>` tags; with HTML, keep
  width around `360`-`480` pixels so the PR stays readable

Keep unsafe screenshots local and say why: payment card entry screens, PHI,
secrets, private customer data, real inbox contents, MFA codes, or production
admin data. Give their local paths without rendering or uploading them.

When updating an existing marked summary or comment, replace dead, expiring,
temporary, or local-only image references with verified durable URLs and
inline previews in the same update. Preserve all author-written text outside
the markers. If an image URL outside a marker is broken, change only that URL,
after verifying the replacement.

Example compact preview block:

```markdown
<details open>
<summary>Signup journey screenshots</summary>

| Step | Preview |
| --- | --- |
| Account details | Shows the default account form before submission; reviewer should check required fields and spacing.<br><img src="https://example.test/01-account.png" width="420" alt="Account details form"> |
| Validation error | Shows the blocked submit state; reviewer should check copy, focus, and error placement.<br><img src="https://example.test/02-validation.png" width="420" alt="Validation error state"> |

</details>
```

## Fix-verify loop hygiene

- Before driving a browser proof of a just-committed fix, confirm the served
  bundle contains it: fetch the bundle URL and grep for a distinctive marker,
  or compare the hash in page or script URLs. Dev-server rebuild races cost
  whole proof rounds and look like "the fix didn't work".
- Wait about 45-60 s before querying an analytics warehouse for just-captured
  events. An empty result inside that window proves nothing.

## Browser extension and vendor interference

- Password-manager extensions (1Password) pull focus into extension frames on
  credential-like fields. After that, all automation on the tab fails with
  "Cannot access a chrome-extension:// URL". To avoid and recover:
  - set form values by element reference in preference to click-and-type
  - dismiss popovers by clicking a neutral page area (Escape may feed the
    popover)
  - recover a wedged tab by opening a fresh one (hosted checkout URLs resume
    by URL)
- Export GIF recordings before closing their tab. Recordings die with the tab
  group.
- Vendor sandboxes rate-limit. For example, the Dropbox Sign test API
  throttles after about 6 signature requests a day, stalling embeds for about
  10 minutes. Budget signature-heavy passes and report throttling as an
  environment limit.

## Stop conditions

Stop and ask the user before:

- running real production payments or destructive production mutations
- rebasing, force-pushing, or modifying an open PR without authorization
- posting comments, sending emails, toggling flags, or changing dashboards
  the user didn't ask for

Otherwise keep going through setup, execution, verification, cleanup, and a
concise result summary.

## Run bounds

- Set a 90-minute wall clock for the whole run. Retries count against it.
- Allow at most 2 retries per journey before marking it failed or blocked.
- If the wall clock expires mid-journey, finalize evidence for what completed,
  mark in-progress items `blocked-timeout`, and report.

## Cleanup

The run's unique marker names real things that now exist in external systems:
accounts, organizations, records, subscriptions, analytics events. Each one
gets a disposition: deleted or registered.

Delete in-run only when all three hold:

1. The surface is **non-production**, established from the environment the
   drive actually reached (the ingestion target, the key, the project ID),
   and not assumed from the stack you launched.
2. The deletion is **scoped by this run's unique marker** alone.
3. The drive **already holds** the credentials that perform it.

Otherwise, or when any condition is uncertain, register the item: name the
marker, the system, and what remains, precisely enough that a repo-side reaper
can find it by marker alone. Production analytics and live-mode billing are
register-only by default.

Always include the cleanup table in the report. "None created" is a valid
disposition.
