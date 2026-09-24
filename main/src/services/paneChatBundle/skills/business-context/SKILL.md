---
name: business-context
description: Build the filesystem business context base for a stakeholder-facing task before discussion, spec, or artifact work.
---

# Business context

Assemble the task's context base before any discussion or spec. The agent
knows only what is in the context base.

## Rules

- Build context only. Drafting and specs belong to later stages.
- Pull relevant context from connected apps, MCP servers and tools, local
  files, prior deliverables, and material the user provided.
- Normalize it into markdown files under `.business/context/`.
- Keep facts, assumptions, unknowns, constraints, and sources separate.
- When context is missing, say what is missing. Never fill the gap by
  guessing.

## Read

- the user request, ticket, transcript, or task description
- available files and app or tool results

## Write

- `.business/context/context.md`
- `.business/context/source-index.md`
- `.business/context/known-facts.md`
- `.business/context/assumptions-unknowns.md`
- `.business/context/constraints.md`

## Output

- source inventory
- known facts
- assumptions
- unknowns
- constraints
- suspected real business goal
- recommended next step: `business-research-adversary` or
  `business-discussion`
