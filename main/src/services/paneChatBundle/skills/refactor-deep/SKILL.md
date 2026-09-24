---
name: refactor-deep
description: Read-only comprehensive analysis of the branch against the remote default branch for large features - derives conventions per layer, hunts for correctness defects in the new code paths, and writes a prioritized refactor plan to ./tmp/. Usually run by the refactor orchestrator alongside refactor-simple; use directly on 10+ file changes.
---

# Deep refactor

Comprehensive read-only analysis for large features and architectural
changes, safe to run anytime. It checks the branch against the conventions of
the repository you are in, hunts for correctness defects in new code paths,
and writes a prioritized plan to `./tmp/`:

1. Classify the change with detailed metrics.
2. Learn the repository's conventions, per layer.
3. Check each layer the diff touches against those conventions.
4. Hunt for correctness defects in new code paths: unguarded I/O, bypassed
   guards, lifecycle and cleanup gaps. This is the part that finds real bugs.
5. Check cross-cutting concerns: SOLID, DRY, documentation, error handling.
6. Write a prioritized plan.

This skill never applies fixes. Standalone, ask the user before running
`refactor-apply`; under `refactor`, the orchestrator owns that gate.

## When to use

- **Large features** (10-20 files, 500-1000 lines)
- **Huge features** (20+ files, over 1000 lines)
- Architectural changes that need thorough validation
- A thorough pre-PR check for complex work

For small and medium changes, use `refactor-simple`. On a large PR, running
both is coverage: their findings overlap by about half, and the rest is
complementary. Run this analysis once per diff; repeated runs converge on the
same findings.

## Process

### Phase 0: Classification and convention discovery

Diff against the merge-base with the remote default branch. A stale local
`main` pulls unrelated commits into the review, and every finding in them is a
false positive.

First resolve the relevant remote from the PR or current branch, and that
remote's default branch. If either is ambiguous or unavailable, report the
comparison as blocked; an unresolved base must not pass as an empty diff.
Record the resolved remote, base ref, and merge-base.

```bash
# Resolve the relevant remote from the PR/current branch configuration first.
# Set REFACTOR_REMOTE to that verified name; do not assume origin.
git remote show "$REFACTOR_REMOTE"
# Resolve its actual default branch and set BASE to the verified remote ref.
# Fetch that branch explicitly if the ref is missing/stale, then verify it.
git rev-parse --verify "$BASE^{commit}"
MB=$(git merge-base "$BASE" HEAD)
git diff "$MB" --name-status
git diff "$MB" --numstat
git diff "$MB" --stat
```

Plain `git diff` omits untracked files, so also list them with
`git ls-files --others --exclude-standard -z`. Treat them as added files:
count and analyze their full contents, with the same lockfile, generated, and
vendored exclusions. Leave the index alone while inspecting.

`$BASE` is the remote's real default branch (`main`, `master`, `develop`).
Diffing from the merge-base to the working tree (one revision) covers
committed, staged, and unstaged work, so a pre-PR run sees uncommitted edits.

If the branch is behind `$BASE`, note "rebase before merge" once. It is
neither a finding nor a score penalty.

Classify:

- **Size**: Large (500-1000 lines) | Huge (over 1000 lines) of hand-written
  change. Exclude lockfiles, generated files, and vendored directories, and
  name what you excluded.
- **Type**: New Feature | Major Refactor | Enhancement
- **Complexity**: Complex | Very Complex, judged on the change itself. A huge
  diff that is one mechanical operation is simpler than its size; say so.
- **Layers**: as this repository names them (for example main, preload, and
  renderer in an Electron app; api and webapp in a monorepo)
- **Modules**: the affected modules

Discover conventions per layer, taking them only from the repository you are
in:

1. Read `CLAUDE.md` and `AGENTS.md` at the root and in every directory the
   diff touches.
2. For each layer, read two or three exemplar files next to the changed code.
   Note how they import, structure code, handle errors, test, and document.
3. Before flagging a convention violation, `grep` how many existing files
   already do the thing. If the codebase does it everywhere, it is the
   convention.

An import style is a finding only when the target repository's guidance and
existing code establish that convention. Explain the actual impact; a
preference remembered from another project sets no severity.

Show the classification:

```
📊 Change Classification:
Size:       Large (15 files, 742 hand-written lines; lockfile excluded)
Type:       New Feature (12 added, 3 modified)
Complexity: Complex (multiple modules)
Layers:     [as the repo names them, with file counts]
Modules:    [list]
Diff base:  merge-base with $BASE at [sha], to working tree

📋 Conventions sourced from:
[the guidance files and exemplars read in step 1-2]

Proceeding with comprehensive analysis...
```

### Phase 1: Per-layer convention analysis

For each layer the diff touches, check the changed code against the
conventions from Phase 0, citing the file that states each one. Fill these
typical dimensions from the repository:

- **Import style**: alias or relative, ordering, allowed cross-layer imports
- **Layering**: where logic may live (handlers or services, pages or hooks,
  main or renderer), and what stays inside its layer
- **Error handling**: the repo's error types and propagation; where try/catch
  is expected and where a wrapper handles it
- **State and data**: the repo's server-state, IPC, and persistence patterns
  and their invariants (cache keys, invalidation, cleanup)
- **Structure**: file and folder placement, local versus shared code, when a
  subfolder with an index is expected
- **Tests**: what the repo tests and how; whether new surface has the test
  neighbouring code would have

For each row, record the local rule, its source file and line, a nearby
example, and the changed code being evaluated. When the repository has no
clear rule for a row, mark it unestablished. Invent no framework, service
superclass, error type, validation library, or directory convention.

### Phase 2: Correctness defects in new paths

This phase is the reason to run deep, and it keeps its full depth on big
diffs. When budget is tight, drop a convention row and keep every correctness
finding. On Huge diffs, do this phase before Phase 1.

For each new or materially changed code path, ask what happens when it goes
wrong, and read far enough to answer:

- **Unguarded I/O**: child processes, sockets, streams, files.
  - Is every `write` and `spawn` paired with an error handler?
  - What happens on early exit, EPIPE, timeout, or a partial handshake?
  - Would an unhandled error reach the process's global handler, and does
    this process have one?
- **Bypassed guards**: when one entry point enforces a check (a doctor, a
  validator, a platform gate, a permission check), does every other entry
  point that reaches the same operation enforce it too? Grep the guard's
  usages.
- **Lifecycle and cleanup**: is everything started also stopped? Timers
  cleared, listeners removed, in-flight work cancelled on unmount or switch,
  and whole process trees killed along with the wrapper shell?
- **Stale state**: does state reset when its key (session, id, account)
  changes? Can a failure leave old data rendered beside a new error?
- **Boundary and platform assumptions**: paths, shells, environments (WSL,
  remote, browser), encodings, and anything hardcoded that another platform
  would break.
- **Untested surface**: new logic without a test where neighbouring code has
  one. Name the specific case that would have caught the defect.

Each finding cites `file:line` and states the concrete failure ("child exits
after `initialize` → EPIPE → uncaught in main process → error dialog").
Reproduce it where that is cheap. A reproduced defect is Critical; a
plausible one is a Warning, listed with the reproduction it needs.

### Phase 3: Cross-cutting concerns

- **SOLID and SRP**: each service, hook, and function has one clear purpose;
  no god objects.
- **DRY**: no duplicate blocks; shared logic lives in utilities or base
  types; each type has a single source of truth.
- **Documentation**: major files have a top-of-file comment where neighbouring
  files do; complex units have JSDoc; non-obvious logic has inline comments;
  TODOs carry context or an issue number.
- **Error handling**: the repo's error types, with every failure and
  rejection surfaced.

**Configuration object pattern (Critical):**

- ❌ Multiple similar functions → consolidate with an options parameter
  (`formatTime()`, `formatTimeCompact()` → `formatTime(date, { format })`)
- ❌ Similar hooks with variations → consolidate with options
- ❌ Two utilities imported for the same purpose → one with options
- ❌ Duplicate interface or type definitions → single source of truth
- ❌ Similar services with minor config differences → consolidate
- ✅ The same function called with different options is fine

Only issues in lines this branch adds or changes count against the PR. You
may list pre-existing debt in touched files under Info as "pre-existing, not
against this PR"; it leaves the score alone. `git blame` settles it.

### Phase 4: Generate the report

Write to `./tmp/deep-refactor-plan-[timestamp].md`:

```markdown
# Deep Refactor Plan

## Classification
- Size: [Large/Huge] ([N] hand-written lines; [M] generated/lockfile excluded)
- Type: [X]
- Complexity: [Complex/Very Complex]
- Layers: [as the repo names them]
- Modules: [list]
- Files Changed: X added, Y modified, Z deleted
- Diff base: merge-base with $BASE at [sha], to working tree
- Conventions sourced from: [files]

## Quality Score: X/10

## Issues Found

### Critical Issues (Must Fix Before Merge)
- [file:line] Issue description
  → Failure: the concrete thing that goes wrong, reproduced: yes/no
  → Fix: detailed instructions
  → Convention: [file that states it] | "correctness"
  → Auto-fixable: Yes/No

### Warnings (Should Fix)
- [file:line] Issue description
  → Suggestion / Impact / Auto-fixable

### Info (Nice to Have)
- [file:line] Suggestion → Benefit
- [file:line] Pre-existing, not against this PR: description

## Auto-Fixable Issues: X
## Manual Fixes Required: Y
**Priority 1 (Blocking):** ...
**Priority 2 (Important):** ...
**Priority 3 (Nice to Have):** ...

## Convention Compliance Matrix
[one row per convention actually checked, with its source file; omit rows
that do not apply to this repo rather than marking them N/A]

## Quality Score Breakdown
- Correctness (Phase 2):  [X/10]
- Conventions (Phase 1):  [X/10]
- Cross-cutting (Phase 3): [X/10]
- Documentation:          [X/10]
**Overall: X/10** - target ≥ 9.8

## Recommendations
1. Hand this plan to `refactor-apply` (auto-fixable first)
2. Address Priority 1, then Priority 2
3. Re-run `refactor-deep` to verify

## References
- Exemplar files studied: [paths]
- Convention sources: [paths]
```

An empty Critical section is a valid result. Report only real findings, and
put only applicable rows in the compliance matrix. "No PR-introduced defects"
is the honest baseline for a clean change and scores accordingly.

### Phase 5: Show the summary

```
📊 Deep Analysis Complete!
Plan: ./tmp/deep-refactor-plan-[timestamp].md
Quality Score: X/10 (target 9.8)
Files Analyzed: X · Critical: Y · Warnings: Z · Auto-fixable: W
Key Issues:
- [criticals, one line each - reproduced ones first]
- [warnings summary]

Return the plan path to the caller. When run standalone, ask before running `refactor-apply`.
```

## Arguments

- `--force-all-patterns`: Check all conventions regardless of classification
- `--classify-as=<type>`: Override type classification
- `--size=<size>`: Override size classification
- `--strict`: Warnings count as Critical for the score, and the target rises
  to 10/10. Strict is always at least as tight as the default 9.8.

## Checklist

- [ ] Diffed from the merge-base with the remote default branch to the working tree
- [ ] Classified with generated lines excluded; complexity judged on the change
- [ ] Conventions read from THIS repo's guidance files and exemplars, per layer
- [ ] Every convention finding confirmed by grep before it was written
- [ ] Phase 2 correctness hunt done on every new path, findings cite file:line
- [ ] Cross-cutting concerns checked
- [ ] Pre-existing debt separated from PR-introduced issues
- [ ] Issues prioritized; auto-fixable vs manual identified
- [ ] Plan written to ./tmp/
- [ ] No files modified (read-only)
