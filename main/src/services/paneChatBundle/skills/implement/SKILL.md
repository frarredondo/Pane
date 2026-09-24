---
name: implement
description: Executes an approved plan with one primary implementation stream by default, using bounded parallel sidecars only when the write scopes are truly disjoint. Supports Claude or Codex as the executor. Runs review gates for completeness and intent fidelity. Use after a plan is approved.
argument-hint: "[plan file path] [claude|codex|--codex]"
disable-model-invocation: true
---

# Implement

## Plan to execute: $ARGUMENTS

## Step 1: Resolve the executor and load the plan

The agent running this skill is the default executor. Claude reads `$ARGUMENTS`
as:

- default: Claude execution
- `claude` or `--claude`: Claude as the primary executor
- `--codex` or standalone `codex`: Codex as the primary executor
- any remaining path-like argument: the plan path

Examples:
- `/implement ./tmp/ready-plans/2026-04-21-foo.md`
- `/implement claude ./tmp/ready-plans/2026-04-21-foo.md`
- `/implement --codex ./tmp/ready-plans/2026-04-21-foo.md`
- `/implement codex ./tmp/ready-plans/2026-04-21-foo.md`

If Codex execution was requested and the Codex plugin is unavailable, tell the
user and wait for direction.

- With a path, read that plan.
- Without one, use the most recent plan in `./tmp/ready-plans/`.
- If the plan has a `Source Artifacts` section or names a brief or dossier,
  read those before coding.

Sources of truth:
- **Brief or intent artifact**: why the work exists, what outcome matters, and
  what must survive optimization.
- **Plan**: execution shape, task order, and file-level details.
- **Dossier**: supporting evidence, patterns, and anchors. It informs the work;
  the plan is the execution contract.

Without a separate brief, the plan's `Intent / Why`, `Locked Decisions`,
`Known Mismatches / Assumptions`, and success criteria are the minimum intent
source.

Read the whole plan for its phases, task checklist, technical requirements,
task dependencies, success criteria, and the user's original intent.

## Step 2: Identify dangerous commands

Before implementing, scan the plan for commands to leave for the user:

- environment variable changes
- package installations that change `package.json` or other manifests
- destructive or irreversible operations

Collect them into a `Manual Steps` list and show it to the user before you
proceed. Step 5.5 handles schema and migrations after review.

## Step 3: Choose the execution strategy

Default to one primary implementer that owns the plan end to end.

Split work into parallel chunks only when all of these hold:
- the write scopes are genuinely disjoint
- the plan already makes the integration contract between chunks clear
- parallel work won't hide missing last-mile wiring
- one primary implementer still owns final integration and finish-line checks

Keep these with the primary implementer unless there is an unusually clean
reason to split them:
- schema and shared types
- routing, bootstrap, and exports
- auth, permissions, and tokens
- jobs, async orchestration, and dispatch semantics
- final frontend-to-backend wiring

```
Primary stream: schema/types → backend/runtime wiring → frontend wiring → finish-line verification
Optional sidecars: bounded disjoint tasks that cannot break the primary stream's integration work
```

## Step 4: Implement

Every executor follows this contract:

- Read the brief first and the full plan before editing code.
- Follow existing patterns and edit existing files where you can.
- Keep the full scope. If you must deviate, add a short `Plan Delta` note to
  the plan.
- Update plan progress as tasks complete.
- A task is complete when its end-to-end runtime or user-facing path is wired
  and still delivers the brief's intended outcome.
- Run the quality checks as you work:

```bash
npm run typecheck
npm run lint
```

**Codex as the running agent:** implement directly in this session.

**Claude executor:** use the Task tool with `subagent_type: "implementer"` for
the primary stream. If you parallelize, keep it bounded:
- **Primary implementer**: owns the mainline path and final integration.
- **Sidecar implementers**: own only clearly disjoint file sets.
- **Sequential**: wait whenever a later chunk depends on an earlier result.
- Give every agent its specific tasks, relevant context, file paths, success
  criteria, explicit ownership boundaries, the brief when available, and the
  contract above.

**Codex executor through the Codex plugin:**
- Use one primary
  `/codex:rescue --wait --fresh --model gpt-5.6-sol --effort medium` run for
  the end-to-end implementation.
- Use `--effort xhigh` for harder work with fuzzy architecture boundaries or
  expensive mistakes. Reserve `max` and `ultra` for very complex, long-running
  tasks that justify the cost.
- Pass the same contract: brief first and plan second, one owner for the whole
  stream, full scope, runtime wiring to the finish line, typecheck and lint
  during the work, and plan progress updates where practical.
- Run one Codex rescue job per primary stream unless the user asks for more
  delegation, and leave that stream to it alone.

Suggested Codex executor prompt:

```
/codex:rescue --wait --fresh --model gpt-5.6-sol --effort medium implement the plan at [plan path]. Supporting brief / intent artifact: [path if available]. Treat the brief as the source of truth for why and the plan as the source of truth for how. You are the primary implementation authority for this run. Do not silently simplify or defer scope. A task is not complete until the end-to-end runtime or user-facing path is wired and still preserves the intended outcome. Run npm run typecheck and npm run lint as you work. Update the plan progress where practical and report any remaining manual steps or unresolved blockers clearly.
```

## Step 5: Review gates

After the primary stream completes, always run a full review against the
`implementation-reviewer` standards. Add a fresh, skeptical second opinion in a
separate context when one is available.

Review runs once. Dispatch both lanes together, in parallel, and run each lane
once. The second opinion is a second reviewer reading the same diff at the
same time, not a second round.

**Claude:** run an `implementation-reviewer` subagent. If the Codex plugin is
available, run the Codex review lane in parallel.

```
Task tool:
  subagent_type: "implementation-reviewer"
  prompt: "Review the implementation against the supporting brief / intent artifact first, then against the plan at [path].
    Supporting brief / intent artifact: [path if available]. Treat the brief as the source of truth for why and the plan as the source of truth for how.
    Run npm run typecheck and npm run lint.
    Check every task in the plan was completed.
    Flag any gaps, missing integrations, convention violations, or brief-intent regressions.
    Report completeness status for each plan task."
```

Codex review lane:

```
/codex:review --wait review the implementation diff against the supporting brief / intent artifact first, then against [plan path]. Treat the brief as the source of truth for why and the plan as the source of truth for how. Focus on whether the code preserves the brief's intended outcome, still respects its constraints and non-goals, actually satisfies the plan, and reaches the finish line at runtime.
```

```
/codex:adversarial-review --wait focus on missing plan tasks, brief-intent regressions, runtime wiring, auth and permission gaps, transaction boundaries, race conditions, background-job registration, dead query-param flows, and whether the implementation actually reached the finish line
```

**Codex:** run the review pass yourself. Use a separate Claude workflow as a
parallel second lane if you have one. Otherwise run an extra adversarial pass
focused on:
- missing plan tasks
- brief-intent regressions
- runtime wiring
- auth and permission gaps
- transaction boundaries
- race conditions
- background-job registration
- dead query-param flows
- whether the implementation reached the finish line

Then, for every agent:

1. Wait for every active review lane to finish.
2. Merge overlapping findings into one result and triage it:
   - **Auto-fixable**: apply the fix.
   - **Needs user input**: surface it clearly.
3. Present one combined set of questions or decisions after all lanes finish.
4. After applying fixes, rerun the project's own checks (tests, lint,
   typecheck, or build) to confirm the fixes hold. Checks confirm fixes;
   reviewers don't. If a fix is large enough to need fresh review, stop, say
   so in your report, and let the user decide.

## Step 5.5: Generate dev migration SQL (if the schema changed)

After the review gates pass and auto-fixable issues are fixed, check whether
`schema.ts` changed:

1. Resolve the comparison base from the current PR or repository
   configuration: find the relevant remote and its default branch (it may not
   be `origin/main`). Fetch that ref if it's missing locally, and verify it.
2. If the base is ambiguous or unavailable, report the comparison as blocked.
   A missing base doesn't mean the schema is unchanged.
3. Diff from the merge base, so upstream-only schema changes stay out, and
   include staged, unstaged, and relevant untracked files:

```bash
git diff "$(git merge-base <verified-base-ref> HEAD)" --name-only | grep schema.ts
git ls-files --others --exclude-standard | grep schema.ts
```

If it changed:

1. Run `npm run db:diff:dev` and capture the output.
2. Present two separate blocks to the user:

**Schema changes (migration SQL):**
```sql
BEGIN;
-- the generated migration SQL here
COMMIT;
```

**Apply migration to dev database:**
```bash
npm run db:migrate:dev
```
(Or the actual command. Run it and show the result.)

3. Include only additive SQL (CREATE, ADD). If destructive SQL (DROP, ALTER
   type) appears, flag it and ask the user to confirm before proceeding.

If `schema.ts` is unchanged, skip this step silently.

## Step 6: Move the plan to done

When every task passes the review gates, the brief's intent holds, and the
implementation is complete, move the plan:

```bash
mv ./tmp/ready-plans/<plan-file>.md ./tmp/done-plans/
```

Create `./tmp/done-plans/` if it's missing. If the review found unresolved
issues, wait until they're fixed.

## Step 7: Present results

Present the combined final review:

```
Implementation complete.

Quality checks:
  typecheck: PASS/FAIL
  lint: PASS/FAIL

Executor used:
  Claude / Codex

Intent fidelity:
  brief / why preserved: PASS/FAIL

Completeness: X/Y tasks done
[List any MISSING or PARTIAL items]

Issues found: [count]
[Summarize key issues if any]

Questions needing user input:
- [Only include items that neither review lane could safely auto-resolve]

Manual steps remaining:
- [ ] [Dangerous commands from Step 2, if any]

Schema changes:
  [If Step 5.5 ran, show the migration SQL and apply command here]
  [If no schema changes, show "None"]

Plan moved to: ./tmp/done-plans/<plan-file>.md

Next steps:
- Fix any issues flagged above
- `/prepare-pr` - Commit, build, and open/update a PR
```

If a review lane found issues, offer to fix them before the user commits.
