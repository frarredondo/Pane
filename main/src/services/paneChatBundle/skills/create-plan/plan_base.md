name: "Base Plan Template v2 - Context-Rich with Validation Loops"
description: |

## Purpose

A template that gives an AI agent enough context and self-validation to reach
working code through iterative refinement.

## Core Principles

1. **Context is king**: include all needed documentation, examples, and
   caveats.
2. **Validation loops**: provide executable lints the agent can run and fix.
3. **Information density**: use keywords and patterns from the codebase.
4. **Progressive success**: start simple, validate, then enhance.
5. **Repo rules**: follow the repo's `CLAUDE.md` and `AGENTS.md`.

---

## Goal

[What needs to be built - be specific about the end state and desires]

## Summary

[3-5 lines summarizing what ships, what areas change, and the overall approach]

## Intent / Why

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]
- [What must remain true even if implementation details change]

## Source Artifacts

- Brief / intent artifact: [path to the normalized brief snapshot or canonical brief]
- Research dossier: [path to the supporting dossier]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]

## Verified Repo Truths

Only facts verified in the current repo, about existing files. Proposed files,
pseudocode, and speculation belong in Delta Design.

Use the subsections that fit this codebase; rename or omit the rest.

### Data / State

- Fact: [Current-state claim]
  Evidence: [path:line-line]
  Implication: [Why this matters for the plan]
  Search Evidence: [Required only for negative/absence claims]

### Entry Points / Integrations

- Fact: [Current-state claim]
  Evidence: [path:line-line]
  Implication: [Why this matters for the plan]
  Search Evidence: [Required only for negative/absence claims]

### Execution / Async Flow

- Fact: [Current-state claim]
  Evidence: [path:line-line]
  Implication: [Why this matters for the plan]
  Search Evidence: [Required only for negative/absence claims]

### Frontend / UI

- Fact: [Current-state claim]
  Evidence: [path:line-line]
  Implication: [Why this matters for the plan]
  Search Evidence: [Required only for negative/absence claims]

### Shared Types / Exports

- Fact: [Current-state claim]
  Evidence: [path:line-line]
  Implication: [Why this matters for the plan]
  Search Evidence: [Required only for negative/absence claims]

## Locked Decisions

- [Design/product decisions already settled by the brief or user]
- [Non-goals and guardrails the implementation must keep intact]

## Known Mismatches / Assumptions

- Mismatch: [Repo-vs-brief mismatch, or explicit assumption]
  Repo Evidence: [path:line-line, plus search evidence if needed]
  Requirement Evidence: [brief text, user request, or external source]
  Planning Decision: [How the plan resolves the mismatch]
- [Write `None` if there are none]

## Critical Codebase Anchors

The highest-value anchors from the research dossier. Keep only those that
materially reduce implementation risk.

- Anchor: [existing repo path, subsystem, or flow]
  Evidence: [path:line-line]
  Reuse / Watch for: [specific pattern, invariant, or constraint]

## All Needed Context

### Documentation & References

List only concrete repo files or external docs that materially reduce
implementation risk. Delete unused lines.

- Repo reference: [existing repo path]
  Why: [pattern, behavior, or caveat to keep in mind]
- External doc: [official URL]
  Section: [specific section if relevant]
  Why: [what it clarifies]
  Critical insight: [key constraint or gotcha]

### Files Being Changed

One tree of every file this plan touches, each marked with what happens to it:

```
[Tree of all affected files, each marked with ← NEW, ← MODIFIED, or ← DELETED]
[Annotate each entry as existing or new when useful for clarity]
```

### Known Gotchas & Library Quirks

Concrete gotchas only. If there are none, write `None`.

- [Concrete repo, library, runtime, or product gotcha and why it matters]

## Reconciliation Notes

Only what materially changed because of the research dossier, kept short. If
the dossier added nothing beyond the draft, write `None`.

- Added from dossier: [anchor, doc, or gotcha imported into the final plan]
- Conflict resolved: [plan-vs-dossier disagreement and repo-verified resolution]
- Intentionally dropped: [duplicate or low-value material removed from the final plan]

## Delta Design

In each subsection, keep existing behavior separate from the proposed change.
Use the subsections that fit this codebase; rename or omit the rest.

### Data / State Changes

Existing:
- [What exists today]

Change:
- [What will change]

Why:
- [Why this shape is appropriate]

Risks:
- [Key implementation or migration risks]

### Entry Point / Integration Flow

Existing:
- [What exists today]

Change:
- [What will change]

Why:
- [Why this shape is appropriate]

Risks:
- [Key routing, orchestration, or validation risks]

### Execution / Control Flow

Existing:
- [What exists today]

Change:
- [What will change]

Why:
- [Why this shape is appropriate]

Risks:
- [Key scheduling / orchestration / concurrency risks]

### User-Facing / Operator-Facing Surface

Existing:
- [What exists today]

Change:
- [What will change]

Why:
- [Why this shape is appropriate]

Risks:
- [Key UX / state / auth risks]

### External / Operational Surface

Existing:
- [What exists today]

Change:
- [What will change]

Why:
- [Why this shape is appropriate]

Risks:
- [Key observability / operational risks]

## Implementation Blueprint

Go top-down: the big picture first, then the specifics.

### Architecture Overview

High-level pseudocode showing how the pieces fit together: data flow,
component relationships, API contracts. The reader should grasp the approach
before any file-level detail.

For a simple feature, such as one endpoint and a UI page, 2-3 sentences are
enough. Save detailed overviews for new data flows, new services, or
cross-cutting changes.

### Key Pseudocode

Cover the **hot spots**: critical logic, tricky integration points, and
non-obvious decisions. Skip straightforward CRUD and boilerplate.

```typescript
// Pseudocode with CRITICAL details - don't write entire code
```

### Data Models and Structure

```typescript
Examples:
 - Data model / schema definitions from the repo's actual source of truth
 - Validation schemas / request contracts from the project's actual validation layer
 - Shared interfaces / types / export hubs used by this codebase
 - API request/response types or other integration contracts
```

### Tasks (in implementation order)

Repeat this block once per task. Remove this instruction in the final plan.

Task [number]:
Goal:
- [What this task unlocks]
Files:
- MODIFY [existing repo path]
- CREATE [new repo path]
Pattern to copy:
- [existing repo path]
Gotchas:
- [Critical caveat]
Definition of done:
- [Observable completion state]

### Integration Points

List only the integration points this change touches, and delete the other
categories.

- Data / schema source of truth: [actual file or directory discovered during the repo audit]
- Entry points to extend: [actual route, command, worker, event, or bootstrap entrypoint]
- Validation layer: [actual library, middleware, or contract pattern used by this repo]
- Domain / service layer: [actual file or directory pattern used by this codebase]
- User-facing / operator-facing surface: [actual page, view, command, or workflow]
- Shared types / export hubs: [actual shared locations if cross-boundary types are needed]
- External / operational hooks: [actual cron, queue, webhook, env, or admin surface if applicable]

## Validation

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint               # ESLint and Prettier
npm run typecheck          # TypeScript compilation
# Expected: No errors. If errors, READ the error and fix.
```

### Factuality Checks

- `Verified Repo Truths` uses `Fact / Evidence / Implication` for every bullet
- Every negative claim also includes `Search Evidence`
- `Verified Repo Truths` has no proposal or future wording
- No placeholder or template strings remain in the final plan
- Every `MODIFY` path exists

### Manual Checks

- Scenario: [Manual scenario]
  Expected: [Expected user-visible or operational result]

## Open Questions

- [Write `None` if there are none]

## Final Validation Checklist

- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Error cases handled gracefully
- [ ] Shared types and contracts are exported from the codebase's actual shared hubs if needed
- [ ] Verified Repo Truths contains only checked facts
- [ ] Every verified fact includes exact evidence
- [ ] Every negative claim includes search evidence
- [ ] `Verified Repo Truths` has no proposal wording
- [ ] Every `MODIFY` path exists in the repo
- [ ] No template or example placeholders remain
- [ ] High-value anchors, docs, and gotchas from the dossier were reconciled into the plan or deliberately dropped
- [ ] Plan-vs-dossier factual conflicts were resolved or surfaced
- [ ] Entry points and integration points match the repo structure found in the audit
- [ ] No unresolved factual blockers remain from review

## Deprecated / Removed Code

- [Code paths to delete or simplify as part of the change]

## Guardrails

- Keep verified repo facts separate from proposed changes.
- Cite only verified file paths and line anchors.
- Back every negative claim with search evidence.
- Label "likely", "seems", and inferred future behavior as assumptions.
- Remove every template placeholder before finalizing.
- Import from the research dossier selectively.
- Re-check the repo before choosing between conflicting plan and dossier
  claims.
- Extend the existing route, bootstrap, service, or module entry point before
  adding a new integration point.
- Copy the repo's exact code patterns; add a new pattern only when no existing
  one fits.
- Run validation even when the change looks safe.
- Keep each async flow in one style: async/await or callbacks.
- Put values that belong in configuration in `.env`.
- Catch specific error types.
- Prefer editing an existing file over creating a new one.
