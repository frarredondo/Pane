---
name: astra-ticket
description: Take a work item through Astra planning, Luna implementation, concurrent checks and focused reviews, optional Sol QA, and a final current-head PR review. Runs in Codex, with GPT-6 Astra as the orchestrator.
---

# Astra Ticket

Input: one work-item reference from any source, for example:

- a GitHub issue URL or `owner/repo#number`
- a Linear issue URL or key (`ENG-123`)
- a Grain brief link

Read and update the item with its source's tools (GitHub tools or `gh`, Linear
MCP tools, Grain tools). The workflow is the same for every source. A source
with no tooling is still valid: read it however you can and report back to the
user. When a tracker item links a Grain brief, read both, and send status,
comments, and PR links to the source that owns the item.

When a Pane Session dispatches it, the prompt also carries the Session ID and
its context (decisions, blockers, evidence, and associated Pane and tab IDs).
Use that context, and report progress in terms of that Session.

## Execution contract

- Confirm from authoritative runtime or session metadata that the parent is
  GPT-6 Astra (`gpt-6-astra`). If it is a different model or you can't confirm
  it, stop; defaults and user assertions don't count as proof.
- Every child uses `gpt-5.6-luna` at `max`, except QA, which uses
  `gpt-5.6-sol` at `medium`. Check support and set model and effort explicitly
  on every spawn. Never substitute a model.
- Give every child its role, the item and plan, the exact base and head SHA,
  the workspace, skill paths, overrides, the evidence destination, and the
  output contract.
- Tell every child to leave all threads unarchived and to leave merging alone.
  Only you, as the parent, archive completed children: archiving an ancestor
  stops the entire agent tree.
- Keep one code writer and one serialized fix queue. Reviewers and evidence
  collectors only read and report: no edits, commits, pushes, rebases, or PR
  readiness changes. Finish branch preparation before freezing the validation
  SHA.
- Run independent work concurrently, in waves when slots are limited. Keep
  each reviewer's context and assignment separate; one omnibus review replaces
  none of them. Promise no fixed completion time.
- Keep a check and evidence ledger: command or review identity, SHA, result,
  and link or path.
  - Reuse passing checks on the same SHA.
  - On a later SHA, rerun the affected checks and record why unaffected
    evidence still applies. Label an old result as old.
- Isolate checks and QA that mutate dependencies, generated output, native
  modules, app data, or ports. Separate worktrees that share caches or
  dependencies are not isolated. Use independent environments or serialize the
  conflicting operations, avoiding Node/Electron ABI and build-output
  collisions.
- Read sibling skills and criteria relative to this skill's directory. These
  workflow overrides take precedence over the skills they call; report any
  missing requirement.

## 1. Establish intent and prepare the branch

Read the item and its comments from its source, the current code, and related
task artifacts in the repository's `TMP/` or `tmp/`, in `$TMPDIR`, and in
`/tmp`. Check older context against current evidence.

Plan as Astra:

- Follow `simple-plan`'s planning steps and `create-ticket`'s intent guidance.
- For UI work, offer `ui-mockup` and carry approved designs into the plan.
  Settle the user's mockup and design decisions before implementation.
- Update the linked brief with the intent, approach, tradeoffs, acceptance
  criteria, and checks. Save detailed specs under a task-specific `tmp/`.
- Reuse Socrates' verdict while its premise and evidence hold. Otherwise
  dispatch a fresh Luna Max
  [Socrates](../create-ticket/references/socrates.md).
- Resolve material questions with the user before coding. If existing behavior
  already meets the outcome, finish with the evidence and guidance.
- This workflow skips `simple-plan`'s routine approval pause once premise
  findings are resolved. Unresolved intent or design decisions still wait for
  the user.

Build and freeze:

1. Delegate implementation and fixes to Luna Max workers, sequencing dependent
   work.
2. Use `prepare-pr` with explicit code-and-branch preparation and draft-PR
   overrides: finish commits and rebase, push, and open or update the draft PR.
   An honest provisional description is fine; the final prose comes later.
3. Freeze the resulting head SHA and base for the batch.

Low-risk path: for deterministic, low-risk copy, translations, docs,
formatting, metadata, or simple config, skip the three focused internal
reviews and default QA to skipped unless requested. Keep the applicable
checks, affected-flow tests, feedback handling, final-head CI, and the final
review gate in step 4. Judge actual risk, beyond the file extension.

## 2. Start independent validation lanes

For other work, ask asynchronously whether to run end-to-end QA, and say it
starts after 60 seconds without a reply. Yes starts QA; no skips it.

- Use a timed wait the user can interrupt, while independent lanes work. A
  question counts as unanswered only after the deadline.
- If timed input isn't available, wait for the answer before dispatching QA,
  and let independent work continue.

Launch these assignments against the frozen SHA. You may monitor CI and
collect automated feedback yourself to save child slots. With limited slots,
start latency-heavy checks and QA first, then fill freed slots with the rest.

- **Checks and CI, Luna Max.** Run the applicable repository checks and
  monitor required CI. Own the shared check ledger. Reviewers use its evidence
  and may request a specific missing check.
- **QA, Sol Medium, if authorized or defaulted.** Use `pr-test-automation` to
  exercise the relevant flows in an isolated environment and capture
  screenshots and reports.
  - Return the tested SHA, failures, blockers, and verified evidence links.
  - Route fixes to the parent queue; QA changes no code.
  - Override the skill's PR-description, comment, and shared-workspace
    publication steps. Return draft QA Markdown plus the captured media and
    report paths to the parent, unpublished.
- **PR prose and evidence, Luna Max.** Use `prepare-pr`'s writing guidance to
  draft the final description, visuals, and evidence index from the item,
  diff, and available results.
  - Override its branch, build, and readiness actions for this lane.
  - Reuse the QA screenshots; run no UI QA of its own.
  - Mark pending results as pending and finalize when evidence arrives. Keep
    draft edits local for the publication owner.
- **Correctness and data, fresh Luna Max reviewer.** Changed algorithms, state
  transitions, lifecycle and concurrency, persistence, migrations, and data
  loss or corruption risks. Return concrete defects and missing evidence in
  this scope.
- **Integration and security, fresh Luna Max reviewer.** Cross-module, API,
  and IPC contracts, caller wiring, compatibility, platform and runtime
  behavior, permissions and trust boundaries, and the security of changed
  paths.
- **Intent and test coverage, fresh Luna Max reviewer.** Compare the item,
  approved plan and design, and acceptance criteria with actual behavior.
  Look for missing integration, user-visible regressions, edge cases, and
  whether tests prove the outcome. Use QA evidence as it arrives; rerun no QA.
- **Automated feedback collection, Luna Max.** Read every human and bot
  review, inline thread, check result, and expected automated-review run, and
  tie each to its SHA. Tell a completed zero-findings review apart from a
  missing, pending, failed, or stale one. Return findings and review status.

Focused reviewers:

- Use configured roles with the [`review`](../review/SKILL.md) skill and its
  [criteria](../review/CRITERIA.md). The assignments above replace its broad
  duplicate checks and out-of-scope duties.
- Each gets raw evidence and returns its own assessment before seeing peer
  conclusions: reviewed SHA, scope, findings with file, line, and impact, and
  unresolved uncertainty.
- Findings go to the parent by default. A reviewer authorized to post a
  scoped review uses `COMMENT`, whatever the account; a focused lane never
  posts `APPROVE` or `REQUEST_CHANGES`. Whole-PR judgments belong to the final
  gate, where the PR author still posts `COMMENT`.

## 3. Reconcile and fix once

Reconcile the batch as Astra into one ordered fix queue: deduplicate findings,
settle conflicts against evidence, and separate blockers from suggestions.
This replaces a separate serial Astra code review; you still own judgment and
readiness.

- Delegate fixes to one Luna Max writer at a time. After each coherent fix
  set, push and record the new SHA.
- Rerun the affected checks. When a fix invalidates QA evidence, Sol retests
  the affected flows. Send material fixes back to the relevant reviewer scope.
- A tiny local fix leaves the three reviews alone. Broaden only for changed
  contracts, changed scope, or concrete unresolved risk. New failures join the
  same queue.
- Cap remediation at three passes for the agreed scope. If findings persist or
  the work grows, report the remaining blocker or decision.

Publication has one serialized owner. It saves the QA artifacts, verifies
their links, refreshes the current PR body and comments, and applies the QA
handoff with the final prose, keeping unrelated human edits. Refresh the
final prose from verified results and reuse the same evidence links. Run
`prepare-pr`'s requested prose cold-read as a bounded writing check, separate
from code review. Verify the saved content.

## 4. Get a final holistic result on the final head

Once internal fixes, affected validation, and QA or its explicit skip are
done, mark the PR ready when appropriate. That can trigger automated review:
wait for the run's terminal result before handoff.

The expected automatic PR reviewer must assess the complete final diff at the
current head SHA. Record the reviewer or run identity, SHA, terminal status,
and result.

- A verified completed review with zero findings counts as a result.
- No comment, an old review, a pending run, or a failed run does not.
- If the completed result predates fixes, request the current-head result
  through the supported mechanism and wait for it.

If the expected automation is absent or unavailable, use one fresh
independent Luna Max holistic reviewer on the final diff, item and plan, and
validation evidence, and label it as the fallback with its reason. This also
applies on the low-risk path. If you can get neither, report the final gate as
blocked; the gate is never waived silently.

Route actionable final-review and human or bot findings through the same fix
queue. After more code changes, refresh the affected validation and get a
final holistic result for the new head. Repeat the focused batch only when the
changed scope warrants it.

Before handoff, read the current head, required CI, and all feedback again.
Call the PR ready only when required checks pass on that head, actionable
feedback is resolved, and the final gate has a verified result. If checks or
review are still pending after five minutes, report their exact state and keep
waiting where feasible; elapsed time never counts as success. Merging is left
to the user.

## Artifacts and handoff

With Grain connected:

- Reuse one task workspace in `Development Artifacts/<org>/<repo>` unless the
  user chose another destination. Verify the organization, folder, audience,
  and links.
- Keep the workspace ID and shared folder, keep local copies, and pass the
  storage rules to every child. Rename the workspace for the PR, keeping its
  identity.
- Save QA media and reports there and verify publication.

Without Grain, follow the called skills' local, tracker, and durable
publication contracts. Report failed or unavailable capture or publication
plainly.

Extend the same intent brief with the final before-and-after behavior,
decisions, verified results, and links between the PR and the evidence in both
directions. Return:

- the PR URL
- tested and reviewed SHAs
- QA, check, and final-review status
- the same verified evidence links
- open findings, with future improvements kept apart from blockers

Open Grain last when connected. Only after an authorized or existing merge is
confirmed, mark the Grain task complete and move it to the configured
completed destination when supported. Keep its identity and shares, and report
any failure.
