---
name: refactor-apply
description: Applies a refactor plan written by refactor-simple, refactor-deep, or the refactor orchestrator's merged report - auto-fixable items first, then manual items one at a time with the user, verifying with the repo's own checks after each group. Use only after the user has reviewed the plan and said to apply it.
argument-hint: "<plan-path> [--auto-only]"
---

# Refactor apply

Turns a reviewed plan into edits. Run it only when asked, on a plan the user
has already seen, whether shown by `refactor` or by an analysis the user ran
directly.

## Input

One plan file: an individual `./tmp/simple-refactor-plan-*.md` or
`./tmp/deep-refactor-plan-*.md`, or the orchestrator's
`./tmp/refactor-merged-*.md`. All three share one shape: Critical, Warning,
and Info sections, each item with `file:line`, a fix, and an
`Auto-fixable: Yes/No` flag.

## Process

### 1. Read the plan and the repo's checks

Parse every item. Then find what "passing" means in this repository: its
lint, typecheck, and test commands from `package.json`, `Makefile`,
`CLAUDE.md`, or `AGENTS.md`. Run them once before any edit, so you can tell a
pre-existing failure from one you caused.

### 2. Auto-fixable items first

Apply every `Auto-fixable: Yes` item, grouped by file.

- Change only the lines the finding names and what the fix strictly needs.
  The PR's scope stays the same.
- If a fix would alter behaviour to satisfy a convention, it is manual: move
  it there and say why.
- After the group, run the repo's checks. Fix straightforward failures you
  introduced. Revert any item you can't make pass, and report it.

`--auto-only` stops here with a summary.

### 3. Manual items, one at a time with the user

Take each `Auto-fixable: No` item in plan priority order, Critical first:

1. State the finding, the proposed change, and any judgment call it needs.
2. Wait for the user's answer.
3. Apply it and run the checks.

The user may skip any item. Record a skipped Critical and move on.

### 4. Report

```
Applied: X auto-fixable, Y manual (Z skipped by user)
Checks: [each command] PASS/FAIL
Reverted: [items that could not pass, with reason]
Left for follow-up: [skipped or out-of-scope items]
```

Leave the edits uncommitted. The user, `refactor`, or `prepare-pr` owns the
commit, so the diff can be reviewed as its own step.

## Rules

- Trace every edit to a plan item. Skip blanket rewrites.
- Preserve behaviour. A behaviour change needs the user's explicit yes and a
  test.
- Apply pre-existing debt marked "not against this PR" only when the user
  names it.
- Secrets, credentials, and generated files are stop conditions.
