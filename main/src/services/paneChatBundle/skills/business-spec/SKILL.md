---
name: business-spec
description: Create a business deliverable spec from the discussion brief and existing context base, then run spec review.
---

# Business spec

This is the business counterpart of `create-plan`. After the human-heavy
`business-discussion` stage, do as much of the remaining spec work
automatically as you can.

## Rules

- Never draft the artifact in this stage.
- Make the spec clear enough that a fresh agent can produce the artifact
  without reading the whole conversation.
- Ground every claim in the context files.
- Include the research-adversary inputs explicitly.
- Define acceptance criteria and a reviewer panel.
- Stop for human input only when context or spec gaps block progress, or when
  the work needs high-stakes judgment.

## Coordinate support stages

- `business-context` and `business-research-adversary` are context steps that
  ran before discussion. If either output is missing or stale, send the
  workflow back to that stage to rebuild it.
- After drafting the spec, run or request `business-spec-reviewer` in a
  fresh context.
- If review returns "revise spec" or "build more context", patch the spec or
  send the workflow back to the right support stage.

## Read

Supplied paths win. The defaults:

- `.business/context/*.md`, including stakeholder research
- `.business/discussion/brief.md`
- [spec_base.md](spec_base.md), the structure for the spec

## Write

- `.business/specs/ready/spec.md`
- `.business/reviews/spec-review.md`, through `business-spec-reviewer`

## Output

- the ready spec, if approved
- otherwise a short blocker report naming the exact missing context or human
  decision

## Grain handoff

- With Grain connected, read and update these artifacts in the task's Grain
  folder. Standalone work goes to `Development Artifacts/YYYY-MM-DD-<task>`.
- Pass the folder ID and storage rule to support agents, and sync their outputs
  yourself if they lack access.
- Keep the local copies you need and respect privacy limits. Without Grain,
  work locally without comment.
