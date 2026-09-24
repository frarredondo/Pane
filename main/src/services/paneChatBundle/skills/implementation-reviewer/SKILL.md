---
name: implementation-reviewer
description: Review completed code changes against a plan, run quality checks, and call out gaps, regressions, or missing integrations. Use when implementation work needs a plan-based review.
---

# Implementation reviewer

Review the implementation against the brief first and the plan second.

The parent workflow talks to the user. Put anything that needs a product or
scope decision in a `Needs User Input` section of your report, and the parent
will aggregate it.

## Process

1. Read the supporting brief or intent artifact, if provided.
2. Read the plan.
3. Read the relevant `AGENTS.md` or `CLAUDE.md` files.
4. Read the project's review criteria, or
   [the review skill's CRITERIA.md](../review/CRITERIA.md).
5. Identify the changed files against the PR's or task's actual base.
6. Run the quality gates.
7. Check plan completeness.
8. Review code quality.
9. Write the report.

## Step 1: Quality gates

- Discover checks from project instructions, CI, manifests, and build
  configuration.
- Run the applicable commands in the right package or directory. Examples, when
  configured: `npm run typecheck`, `npm run lint`, `pytest`, `cargo test`, or a
  document or skill validator.
- Record each command and its evidence. Mark absent checks N/A and unavailable
  tools BLOCKED.
- Separate existing failures from new regressions.

## Step 2: Plan completeness

The brief is the source of truth for why; the plan is the source of truth for
how.

For every task in the plan:
1. Understand what it requires.
2. Find the corresponding code changes.
3. Verify the implementation matches the plan.
4. Check that its integration points are wired up.

Classify each task as `[DONE]`, `[PARTIAL]`, `[MISSING]`, or `[DEVIATED]`.

Also check:
- the plan's success criteria
- fidelity to the brief's intent
- integration points
- edge cases the plan mentions
- end-to-end path completeness

A value the diff emits that nothing consumes, or a surface nothing can reach,
is `[PARTIAL]` or `[DEVIATED]`.

## Step 3: Code quality

Review the changed files against the selected criteria, applying only the
relevant sections. Focus on, in order:
- must-fix correctness and security issues
- should-fix architecture and stack-specific quality
- lower-priority convention issues

## Step 4: Report

Use this structure:

```text
## Implementation Review

### Quality Gates
[Actual command/check]: PASS/FAIL/BLOCKED/N/A — evidence or reason

### Brief / Intent Fidelity
PASS/FAIL

### Plan Completeness ([done]/[total] tasks)
- [DONE] ...
- [PARTIAL] ... — what's missing: ...
- [MISSING] ... — expected in: ...
- [DEVIATED] ... — deviation: ...

### Integration Check
[Applicable integration]: wired / missing / N/A — evidence
Examples: routes, exports, UI/data connections, schemas, document links.

### Schema Changes
[Only if this change affects a schema or data contract]

### Code Quality Issues
Must-Fix
Should-Fix
Suggestions

### Remaining Work
[Actionable blocking and non-blocking items]

### Needs User Input
[Only genuine decisions]

### Summary
- Overall: Ready / Needs fixes
- Plan completion: [done]/[total]
- Estimated effort for remaining work: trivial / small / significant
```

## Rules

- Run the checks the repository actually has. An absent toolchain is N/A.
- Cite file paths and line numbers.
- For every `[PARTIAL]` or `[MISSING]` item, say exactly what is needed.
- Missing runtime wiring is blocking.
- A regression against the brief's intent is incomplete or deviated work.
- Address the report to the parent workflow; questions for the user go in
  `Needs User Input`.
