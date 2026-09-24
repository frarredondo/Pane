---
name: refactor
description: Post-PR refactor pass. Sizes the diff against the remote default branch, fans out refactor-simple (and refactor-deep on large changes) as fresh subagents that run blind to each other, merges their plans once with max-severity rules, shows the merged report, and hands it to refactor-apply on the user's word. Use after a PR is open, or whenever the user asks to refactor or clean up the branch.
argument-hint: "[--size=small|large] [--plan-only]"
---

# Refactor

The manual post-PR quality pass. It sizes the change, runs the right analyses
independently, merges them once, stops for the user, then applies. Applying
changes the head, so run it before QA when QA evidence must come from the
current head.

## Blind analyses, one merge

Each analysis runs in a fresh subagent that never sees the other's output,
and the merge happens once, here, after both finish. Independent runs of
`refactor-simple` and `refactor-deep` overlap on about half their findings;
the rest is complementary, and the severe correctness findings often come
from only one of them. Run each analysis once per diff.

## Process

### 1. Size the change

```bash
BASE=$(git symbolic-ref -q refs/remotes/origin/HEAD | sed 's|refs/remotes/||')
[ -n "$BASE" ] || BASE=origin/$(git remote show origin | sed -n 's/.*HEAD branch: //p')
git fetch origin "${BASE#origin/}"
git diff "$(git merge-base "$BASE" HEAD)" --numstat
```

This diffs the merge-base with the remote's real default branch against the
working tree, so uncommitted work counts.

Leave lockfiles, generated files, and vendored directories out of the count.
Under about 10 hand-written files and 500 lines is **small**; anything above
is **large**. `--size` overrides. State the size and file count before
fanning out.

### 2. Fan out independently

Run each analysis as its own fresh-context subagent, all launched together so
they run concurrently (Claude: one Agent tool call per analysis, in the same
message). The prompt names the skill and the worktree and nothing else. Each
subagent invokes its skill and returns the absolute path of its plan.

- **small**: `refactor-simple` only.
- **large**: `refactor-simple` and `refactor-deep`, concurrently.

Each writes its own file under `./tmp/` and reads only its own.

### 3. Merge once

Read every plan and write one merged report to
`./tmp/refactor-merged-[timestamp].md`. Rules, in priority order:

1. **Cluster** findings about the same file or area and the same underlying
   issue, however they are worded.
2. **Keep the maximum severity.** Critical in one plan and Warning in another
   is Critical. A reproduced defect keeps its reproduction.
3. **Keep sole-source findings.** Corroboration isn't required; disagreement
   between independent runs is signal.
4. **Tag every item** `[S]`, `[D]`, or `[S+D]` to show who found it.
5. **Carry each plan's quality score as reported**, plus the merged Critical,
   Warning, and Info counts. The merged report has no combined score.
6. Items marked pre-existing, not against this PR, stay in Info unchanged.

Keep each item's `file:line`, fix, and auto-fixable flag from its source
plan. The merged report has the same shape as the individual plans, so
`refactor-apply` reads it as is.

### 4. Stop for the user

Run `cold-read` on the merged report first, since a person reads it to decide
what to change in their code. The cold-read may reorder, retitle, and
clarify; severities, findings, and `file:line` stay as written.

Then show it: Criticals in full, Warnings and Info summarised, with the
auto-fixable and manual counts. Stop here. Nothing is applied until the user
says so. `--plan-only` ends here.

Show auto-fixable items too, even though they are the safe class. Each manual
item waits for the user's judgment.

### 5. Apply, then prove it

On the user's go, invoke `refactor-apply` on the merged report: auto-fixable
items first, then manual ones with the user. `refactor-apply` leaves its
edits uncommitted. Commit them here as one scoped commit named for the plan
and the round, so the adversary has an exact diff. Commit every later repair
the same way before its review.

Then run the adversarial loop as one continuous chain and report when it
ends. The cap is three review passes.

1. **Pass 1 reviews the apply commit.** A fresh subagent reads only that
   commit's diff (`git diff <sha>~1..<sha>`), briefed to prove it broke
   something:
   - every claim in the apply report is a claim to falsify
   - a behaviour-preserving change must have preserved behaviour
   - a consolidation must keep every edge case a caller relied on
   - a test that claims to fix a defect must fail on the parent and pass on
     the head; characterization tests for behaviour-preserving changes may
     pass on both

   It returns CLEAN, or REGRESSION with `file:line` and a repro.
2. **On REGRESSION, the applier repairs and two reviewers look.** The repro
   goes back to the apply session, which knows the code. The repair is
   committed with the repro as a test proven to fail on its parent. Then, in
   the same message:
   - The reviewer who found the finding gets the repair as a follow-up in its
     own session, re-runs its repro, and says whether the finding is closed.
   - A fresh subagent reads only the repair commit's diff, briefed to break
     the repair itself. A repair can break an adjacent case the first
     reviewer was primed to overlook.

   The follow-up settles the finding. The fresh pass is the numbered pass and
   counts toward the cap.
3. **Pass 3 is the last.** Reaching it means each repair fixed the reported
   inputs and broke the next ones, so the repair before pass 3 is
   spec-driven: the applier writes the input class as a test table, or
   replaces the mechanism with a pure derivation. If the correct fix needs
   scope beyond the files at hand, the applier stops without committing.
   Whatever pass 3 finds goes to the user with the plan.

A CLEAN pass advances. At the cap, advance anyway: report the survivors as
open Criticals beside the delta, and let the user decide. Then re-run the
analyses once (step 2, fresh subagents) and show the delta: what closed, what
remains, and anything new.

## Rules

- Steps 1-4 leave tracked files untouched. Only step 5 edits code, and only
  after the user's explicit go.
- Analyses run in fresh subagents, blind to each other. Each plan stays out
  of every other analysis.
- Merging means clustering and keeping the maximum severity.
- If a subagent fails or returns no plan, say so and merge what exists.
- Run the adversarial loop as one chain and report at the end. Waiting on a
  person between rounds turns ten minutes of agent work into hours.
- The reviewer who found a finding verifies its repair in its own session; a
  fresh reviewer hunts for what the repair introduced.
