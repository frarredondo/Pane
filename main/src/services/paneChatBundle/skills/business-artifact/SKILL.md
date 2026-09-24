---
name: business-artifact
description: Create the business artifact from an approved spec, then coordinate claim/evidence ledger creation, artifact review, anti-sycophancy review, and human gate.
---

# Business artifact

This is the business counterpart of `implement` plus implementation review.
Once the spec is ready, do as much as you can automatically.

## Rules

- Read the approved spec first.
- Use only facts grounded in the context or the spec. Never invent claims,
  numbers, dates, pricing, commitments, or legal or compliance statements.
- Keep a claim/evidence ledger.
- Shape the draft for its artifact type.
- After the draft and the ledger, run or request `business-artifact-reviewer`
  in a fresh context.
- Apply the required patches when review names concrete fixes.
- Stop for human input only when review requires a human gate or the available
  context is too thin to finish the artifact safely.

## Read

Supplied input and output paths win. The defaults:

- `.business/specs/ready/spec.md`
- `.business/context/*.md`, including stakeholder research
- `.business/reviews/spec-review.md`

## Write

- `.business/artifacts/draft.md`
- `.business/artifacts/claim-evidence-ledger.md`
- `.business/reviews/artifact-review.md`, through `business-artifact-reviewer`

## Output

- the draft artifact
- the claim/evidence ledger
- the artifact review result
- a short next step: patch, human gate, or ready for release

Claim ledger format:
| Claim | Evidence | Status | Risk | Fix |
|---|---|---|---|---|

## Grain handoff

- With Grain connected, read and update these artifacts in the task's Grain
  folder. Standalone work goes to `Development Artifacts/YYYY-MM-DD-<task>`.
- Pass the folder ID and storage rule to reviewers, and sync their outputs
  yourself if they lack access.
- Keep the local copies you need and respect privacy limits. Without Grain,
  work locally without comment.
