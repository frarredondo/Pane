---
name: astra-ticket
description: Take a GitHub ticket through Astra planning, Luna implementation, PR creation, optional Sol QA, Luna and Astra reviews, and bounded QA revalidation. Runs in Codex, with GPT-6 Astra as the orchestrator.
---

# Astra Ticket

Input: a GitHub issue URL or `owner/repo#number`. When a Pane Session
dispatches it, the prompt also carries the Session ID and its context
(decisions, blockers, evidence, and associated Pane and tab IDs). Use that
context, and report progress in terms of that Session.

## Models

- Before any task work, confirm from authoritative runtime or session metadata
  that the orchestrator is GPT-6 Astra (`gpt-6-astra`). If it is a different
  model or you can't confirm it, stop; defaults and user assertions don't
  count as proof.
- Every subagent except QA uses `gpt-5.6-luna` at `max` effort. Check that the
  model and effort are supported before spawning, and stop if they aren't. Use
  exactly this model.
- Set the model and effort explicitly on every spawn, with fresh context where
  a step asks for it. Pass the applicable workflow overrides, the ticket, the
  workspace, and the artifacts.

## Standing rules

- Reuse checks that passed on the same commit. After a change, rerun the
  affected checks, plus any others a concrete finding points to.
- Before each review and the final handoff, read human and bot feedback and
  CI, and address actionable findings. Report checks still running after five
  minutes. Call the PR ready only when actionable threads are resolved and
  required checks pass on the final commit.
- Low-risk changes that deterministic checks verify quickly (copy,
  translations, docs, formatting, metadata, simple config) skip the internal
  Luna and Astra reviews (steps 6 to 8), and QA in step 5 defaults to skipped
  unless requested. Keep the applicable checks, retests of affected flows,
  final-head CI, and GitHub feedback handling.
- Only you, as the Astra orchestrator, archive completed child tasks. Tell
  every subagent to leave all threads unarchived: archiving an ancestor stops
  the entire agent tree.

## Steps

1. **Gather context.** Read the issue, its comments, and related artifacts in
   the repository's `TMP/` or `tmp/`, in `$TMPDIR`, and in `/tmp`, and check
   older context against the ticket and the code.
   - With Grain connected, reuse the linked workspace. New work goes to
     `Development Artifacts/<org>/<repo>` unless the user names a destination;
     ask when a name is ambiguous. Check the organization, folder, and
     audience, and return the location with the link. Rename the workspace for
     the PR, keeping its ID and shared folder.
   - Keep every development artifact in that one task workspace, keep local
     copies, and pass the workspace ID to every subagent.
   - Without Grain, work locally.
2. **Plan as Astra.** Read `simple-plan` and use its planning steps to
   investigate and write a concise plan that keeps the ticket's intent,
   constraints, and scope.
   - Use `create-ticket`'s intent guidance, and update the linked brief with
     the approach and tradeoffs before coding.
   - Reuse Socrates' verdict while its premise and evidence hold. Otherwise
     dispatch a fresh Luna Max
     [Socrates](../create-ticket/references/socrates.md) with the ticket, the
     plan, and repository evidence. Resolve material findings with the user.
     If existing behavior already meets the outcome, finish with the evidence
     and guidance.
   - Derive the detailed specs yourself: files, changes, dependencies, edge
     cases, acceptance criteria, and checks. Save the plan and specs under a
     task-specific `tmp/`.
   - This workflow skips `simple-plan`'s routine approval pause once the
     premise findings are resolved.
3. **Implement.** Spawn Luna Max implementers with the ticket, plan, specs, and
   artifacts. Sequence dependent tasks, wait for each to finish, and inspect
   the work and check results.
4. **Open the PR.** Spawn a Luna Max agent to open or update the PR with
   `prepare-pr`, passing explicit code-and-branch preparation and draft-PR
   overrides. After QA (or an explicit skip) and the internal reviews finish,
   mark it ready, then check any triggered automated reviews and final-head CI
   and address actionable feedback before handoff.
5. **Offer QA.** (Low-risk changes skip this unless QA is requested; see
   Standing rules.) Before the reviews, ask asynchronously whether to run
   end-to-end PR QA, and say it starts after 60 seconds without a reply. Yes
   starts QA; no skips it. Use a timed wait the user can interrupt; a question
   counts as unanswered only after the 60 seconds pass. If timed input isn't
   available, wait for an answer.
   - QA runs on GPT-5.6 Sol (`gpt-5.6-sol`) at `medium` effort using
     `pr-test-automation`. Check model support, and use exactly this model.
   - Luna Max fixes and pushes QA bugs, then Sol reruns the affected flows
     before the reviews. Report blocked QA as blocked.
   - Capture QA screenshots. With Grain connected, save and verify the media
     and reports there; otherwise follow `pr-test-automation`'s durable
     publication steps.
   - Carry the QA handoff into the final brief, keeping future improvements
     separate from current blockers. Return the same verified evidence link in
     the final handoff, and say plainly when capture or publication was
     unavailable.
6. **Luna reviews.** Run up to three fresh Luna Max reviews one after another
   with the `review` skill on the current PR, and stop after a clean one. After
   each review, have Luna Max make the actionable fixes, run checks, and push
   before the next review starts. Post reviews as `COMMENT` when you are
   authenticated as the PR author.
7. **Astra review.** Review the PR yourself with the same `review` skill. Have
   Luna Max make any fixes, then verify them yourself.
8. **Revalidate.** If review fixes invalidate completed QA, Sol retests the
   affected flows, then one fresh Luna Max agent reviews the fixes that rerun
   covered. Report the remaining findings; the review loops run once.
9. **Hand off.** Return the PR URL, the QA and check results with the commits
   they ran on, and open findings. Merging is left to the user.
   - After QA (or a skip), the reviews, and final-head CI, extend the same
     brief from the published PR with before-and-after behavior and verified
     results. Keep the intent, sources, and decisions, check the content and
     the links in both directions, then open Grain last.
   - Once an authorized or existing merge is confirmed, mark the Grain task
     complete and move its workspace to the configured completed-work
     destination when supported. Keep IDs, shares, and the shared folder,
     check the location and links, and report a failed move.

Keep required tracker publication, local paths, and evidence contracts
alongside Grain. The `review` skill and its criteria are in the project skills
directory next to this skill; report any skill you can't find. These workflow
overrides take precedence over the skills they call.
