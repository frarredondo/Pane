---
name: create-ticket
description: Capture work and evolving intent during discussion as one or more GitHub tickets, Grain briefs, or both. Use for ticket or issue creation, follow-ups, backlog capture, delegation, and revisions as decisions change. Preserves the what, why, outcome, scope, and acceptance criteria.
argument-hint: "[ticket request, conversation summary, or issue intent]"
allowed-tools: Read, Grep, Glob, Bash
---

# Create ticket

You keep the intent when work is handed off. The next person should understand
what should change, why it matters, and what success looks like.

## Capture the intent

- For an open-ended idea, explore it conversationally: follow the user's
  questions, look up the facts, and recommend with reasons.
- For a clear request or an existing brief, build on the settled decisions and
  focus on the gaps that remain, then finalize as described below.
- Read the conversation, the issue, and linked briefs. Use
  [intent-handoff.md](references/intent-handoff.md) to capture and refine the
  work.
- For a UI change, offer a best-effort `ui-mockup` to clarify the design, and
  include the approved result in the ticket or brief.

## Shape the handoff

- Deliver what was asked for: one or more tickets, Grain briefs, or both. Keep
  one coherent outcome together. Split work with independent outcomes, owners,
  or release timing, and link the shared context and dependencies.
- For GitHub work, resolve the repository and look at related issues and
  briefs. Update the matching artifact for an authorized revision, and create a
  follow-up for distinct work.
- Give it a readable, action-oriented title in the repository's style, such as
  `fix: make refund exports reconcilable`.
- Use this skill during discussion whenever concrete work or a change in intent
  needs capturing. Draft freely while exploring. Save or publish once the
  request or the active workflow authorizes that destination. Set assignees,
  labels, and milestones when they are requested or obvious.

## Refine before finalizing

1. Open the draft in Grain or the requested destination and refine it with the
   user.
2. When the user considers it ready, dispatch a fresh
   [Socrates](references/socrates.md) reviewer with the brief, the discussion
   evidence, and repository access.
3. Relay material questions. Update the same brief with the answers, decisions,
   and reasons, and record Socrates' verdict against the version it reviewed.
4. Continue the same Socrates agent through feedback. If it can't be resumed,
   say so and pass the full review record to its replacement. A verdict stays
   valid while its premise and evidence hold.
5. If you can't dispatch a reviewer, the gate stays open until the user
   explicitly waives it.
6. Once the user confirms and has resolved or explicitly deferred the material
   questions, create or update the authorized tickets, keeping their identity
   and history. An explicit request to publish an agreed brief counts as
   confirmation.

## Keep a living Grain brief

- When saving intent with Grain connected, follow Grain's installed skill to
  create or update the briefs. Honor Grain-only, GitHub-only, combined, and
  draft-only requests. For ticket work, prefer a linked Grain brief alongside
  the issue.
- Reuse the linked workspace. New work goes to
  `Development Artifacts/<org>/<repo>` in the intended Grain organization
  unless the user names a destination. Ask when a name is ambiguous.
- Name the workspace for the task and keep its ID. Check the organization,
  folder, and audience, and return the location with the link.
- Use `explain-visually` when a visual would clarify the intent, and add it to
  the same brief.
- Link tickets and their briefs to each other.
- For an authorized revision, reconcile the latest discussion and linked
  artifacts before updating them. Keep accurate human contributions, and raise
  conflicting decisions for the user to resolve.
- If Grain is disconnected, put the full brief in GitHub when ticket
  publication is authorized; otherwise return a copyable draft in the requested
  destination. Report a failed save and the status of each artifact
  separately.
- Match access to the intended audience. Keep sensitive material in approved
  private destinations, and create public shares only for an audience the user
  authorized. Pass the workspace ID and storage rule to helpers.

## Verify and return

- Use the available GitHub tools, with authenticated `gh` as a fallback. Send
  titles and bodies as structured data or body files.
- Before publishing, read it as the assignee would: can they explain what
  changes, why, how success shows up, and which decisions are still open?
- Read back each saved ticket or brief and check its content, links, audience,
  and current intent. Look at any visual companion, and state what you could
  and couldn't verify.
- Return the ticket and brief links grouped by outcome, with the save status
  where it matters. Carry these links into planning, implementation, and PR
  handoffs.
