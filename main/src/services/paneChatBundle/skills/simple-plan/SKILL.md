---
name: simple-plan
description: Quick gut-check before implementing when the user directly asks you to do something (e.g. "add X", "fix Y", "change Z"). Investigates, proposes a lightweight plan, and implements after approval. Use this instead of /create-plan when the user wants something done, not a formal plan.
argument-hint: "[what the user wants done]"
allowed-tools: Read, Grep, Glob, WebFetch
---

# Simple plan

When the user directly asks for a change, investigate first and propose a
short plan. Write code only after the user approves it.

## Plan contents

### Intent and sources

- The triggering problem, why it matters, the intended outcome, and the
  constraints and non-goals from the ticket or discussion
- Available source links or artifact paths. Flag missing rationale, and mark
  which points are your assumptions and which are user decisions.

### Current state

- Root cause or current behavior
- File references and code snippets where relevant

### Proposed changes

- What needs to change
- File references and code snippets where needed
- A task list of all the work, in implementation order

### Advice

Principal-engineer guidance on architecture and implementation, when useful.

## Process

1. Investigate the codebase.
2. Present the plan to the user.
3. Wait for approval.
4. After approval, keep one primary implementation authority. Claude: hand the
   whole plan to one `implementer` subagent. Split the work only when the
   write scopes are clearly disjoint.
5. Keep the user's why, constraints, and non-goals explicit while
   implementing, alongside the task list.
6. After implementation, run `implementation-reviewer`. When a second
   reviewer is available (the Codex plugin for Claude, a Claude workflow for
   Codex), run it in parallel and wait for both before declaring completion.

## Notes

- Keep the plan concise and concrete, with file paths and code snippets.
- If the task is broad or risky, recommend switching to `create-plan`.
- The final review checks both task completion and whether the result still
  meets the user's original intent.

User query: $ARGUMENTS
