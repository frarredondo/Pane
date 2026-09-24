---
name: refactor-simple
description: Read-only code quality analysis of the branch against the remote default branch for small to medium changes - classifies the diff, derives conventions from the target repo, and writes a refactor plan to ./tmp/. Usually run by the refactor orchestrator; use directly for a quick pre-PR check on 2-10 files.
---

# Simple refactor

Read-only code quality analysis for small and medium changes, safe to run
anytime. It checks the branch against the conventions of the repository you
are in and writes a refactor plan to `./tmp/`:

1. Classify the change (size, type, complexity).
2. Learn the repository's conventions.
3. Find code smells and convention violations in the changed lines.
4. Write a plan that separates auto-fixable from manual issues.

This skill never applies fixes. Standalone, ask the user before running
`refactor-apply`; under `refactor`, the orchestrator owns that gate.

## When to use

- **Small changes** (2-5 files, 50-200 lines)
- **Medium changes** (5-10 files, 200-500 lines)
- Bug fixes and enhancements
- A quick pre-PR quality check

For large features (over 10 files or 500 lines), use `refactor-deep`. Simple
is the cheap pass with the cleanest signal-to-noise; deep finds real defects
in big diffs. On a large PR, run both for coverage: their findings overlap by
about half, and the rest is complementary.

## Process

### 1. Classify changes

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

Determine:

- **Size**: Tiny (<50) | Small (50-200) | Medium (200-500)
- **Type**: Bug Fix | Enhancement | Refactor
- **Complexity**: Trivial | Simple | Moderate
- **Layers**: Backend | Frontend | Both

Size counts changed source lines. Lockfiles, generated files, and vendored
directories can add thousands of lines and no complexity: name them and
classify on the hand-written change.

### 2. Learn the repository's conventions

Take conventions only from the repository you are in:

1. Read `CLAUDE.md` and `AGENTS.md` at the root and in every directory the
   diff touches. They state the conventions the maintainers enforce.
2. Read two or three finished exemplar files next to the changed code. Note
   how they import, structure code, handle errors, and document.
3. Before flagging a convention violation, `grep` how many existing files
   already do the thing. If the codebase does it everywhere, it is the
   convention.

An import style is a finding only when the target repository's guidance and
existing code establish that convention. Explain the actual impact; a
preference remembered from another project sets no severity.

Pattern matrix:

- **Tiny or bug fix**: universal smells only
- **Small or enhancement**: universal smells plus the repo's basic
  architecture rules
- **Medium**: universal, architecture, and documentation for new files

Universal smells, in any repository:

- long functions (over 100 lines), deep nesting (over 3 levels)
- magic numbers and strings
- missing or swallowed error handling on new paths
- unused imports or variables, commented-out code, TODOs without context
- duplicate logic: two similar functions, hooks, or types where one with
  options would do
- new public surface without a file- or symbol-level comment when the
  neighbouring code has them

Repo-derived rules (Small and up): import style, layering (where logic may
live), state-management and hook patterns, error types, and test conventions.
Use whatever steps 1-3 surfaced, citing the file that states each rule.

### 3. Analyze files

Read the changed files and the untracked files listed in step 1:

```bash
git diff "$MB" --name-only
```

Only issues in lines this branch adds or changes count against the PR. You
may list pre-existing debt in touched files under Info as "pre-existing, not
against this PR"; it leaves the score alone. Read enough surrounding code to
tell the two apart, and let `git blame` settle it.

### 4. Generate the report

Write the plan to `./tmp/simple-refactor-plan-[timestamp].md`:

```markdown
# Simple Refactor Plan

## Classification
- Size: [X] ([N] hand-written lines; [M] generated/lockfile lines excluded)
- Type: [X]
- Complexity: [X]
- Diff base: merge-base with $BASE at [sha], to working tree
- Conventions sourced from: [files read in step 2]

## Quality Score: X/10

## Issues Found

### Critical (Must Fix)
- [file:line] Description
  → Convention: [file that states it, or "universal"]
  → Fix: How to fix
  → Auto-fixable: Yes/No

### Warnings (Should Fix)
- [file:line] Description
  → Suggestion: Improvement
  → Auto-fixable: Yes/No

### Info (Nice to Have)
- [file:line] Suggestion
- [file:line] Pre-existing, not against this PR: description

## Auto-Fixable Issues: X
## Manual Fixes Required: Y

## Convention Compliance
✓/✗ [each repo-derived rule checked, with its source file]

## Recommendations
1. Hand this plan to `refactor-apply` (auto-fixable first)
2. Manually fix [specific issues]
3. Re-run `refactor-simple` to verify

## References
- Exemplar files studied: [paths]
- Convention sources: [paths]
```

An empty Critical section is a valid, common result. Report only real
findings: "no PR-introduced defects" is the honest baseline for a clean change
and scores accordingly.

### 5. Show next steps

```
📊 Analysis complete!
Plan written to: ./tmp/simple-refactor-plan-[timestamp].md
Quality Score: X/10
Auto-fixable: X issues · Manual fixes: Y issues
Issues found: [one line each for criticals and warnings]

Return the plan path to the caller. When run standalone, ask before running `refactor-apply`.
```

## Arguments

- `--strict`: Treat Medium as Large (stricter enforcement)
- `--classify-as=<type>`: Override type classification
- `--size=<size>`: Override size classification

## Checklist

- [ ] Diffed from the merge-base with the remote default branch to the working tree
- [ ] Changes classified, generated lines excluded from size
- [ ] Conventions read from THIS repo's guidance files and exemplars
- [ ] Every convention finding confirmed by grep before it was written
- [ ] Pre-existing debt separated from PR-introduced issues
- [ ] Auto-fixable vs manual separated
- [ ] Plan written to ./tmp/
- [ ] No files modified (read-only)
