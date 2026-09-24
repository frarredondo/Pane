---
name: business-discussion
description: Have a business-goal discussion using the context base without drafting the deliverable.
---

# Business discussion

This is the main human-in-the-loop stage. Discuss the business goal from the
context base. Never draft the artifact in this stage.

## Ground the discussion first

- If `.business/context/` is missing or empty, run or request
  `business-context`. For serious work, also run or request
  `business-research-adversary`.
- Start only once the context base holds real internal and external context.
  Discussion without it is guessing.
- Read the context files before you probe.

## Discuss

- Probe only the high-leverage uncertainties.
- Offer concrete options and recommendations over broad questionnaires.
- Clarify the decision, audience, stakes, constraints, and non-goals.

## Read

- `.business/context/context.md`
- `.business/context/research-adversary.md`
- `.business/context/known-facts.md`
- `.business/context/assumptions-unknowns.md`
- `.business/context/constraints.md`

## Write

- `.business/discussion/brief.md`

## Output

- confirmed goal
- confirmed audience and stakeholders
- intended reader transformation
- artifact type
- key decisions
- unresolved questions
- risks and watchouts
- recommended next step
