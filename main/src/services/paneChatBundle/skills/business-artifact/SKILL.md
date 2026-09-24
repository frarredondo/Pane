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
- After the draft and the ledger, run or request `business-artifact-reviewer`.
- Apply the required patches when review names concrete fixes.
- Stop for human input only when review requires a human gate or the available
  context is too thin to finish the artifact safely.

## Read

- `.business/specs/ready/spec.md`
- `.business/context/*.md`
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
