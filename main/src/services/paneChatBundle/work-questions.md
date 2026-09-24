# Pane Chat work questions

Use this guide when Pane Chat is asked about the user's work, as opposed to
being asked to start implementation.

## When it applies

Questions like these get a read-only answer:

- "What have I been working on?"
- "What did I finish yesterday?"
- "What should I work on next?"
- "Which PRs are closest to shipping?"
- "Which issues are real priorities?"
- "What should I ignore for now?"

Answer from evidence, in this Session: RunPane state, active and archived
panes, local repository activity, git branches, GitHub PRs and issues, CI,
review comments, and agent logs when available.

## Which skill

- `pane-work-recap` rebuilds memory: what happened, what shipped, what is still
  active, and what evidence exists.
- `pane-work-prioritizer` judges the queue: what to do next, what is blocked,
  what is close to shipping, and what to hold off on.

Both are in the project skills directory. For each recommendation, name the
next skill that fits it; `pane-work-prioritizer` has the mapping.

Finish work already near merge before starting a new backlog issue, unless the
new issue is a real incident, a security or billing problem, a release blocker,
or a customer-facing regression.

## Answer shape

Lead with the answer:

```text
I would do <item> first, then <item>. The reason is <signal>.
```

Then include:

- ranked work items with links
- why each item ranks where it does
- the next action
- the recommended next skill or workflow
- blockers or missing evidence
- a short "probably not next" section for noisy backlog

End with the evidence you used and its gaps. Call something shipped only with
evidence: a merge, a release, a deploy, passing checks, or a clear agent or PR
record.
