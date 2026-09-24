---
name: pane-work-recap
description: Summarize recent Pane workspace activity from active panes, archived panes, branches, pull requests, and agent logs. Use when the user asks what they worked on, what they finished, what shipped, what is still active, or asks for a recap over a time window such as today, yesterday, the last 24 hours, this week, recently, or an open-ended "what have I been working on?"
---

# Pane Work Recap

Reconstruct what happened in Pane over the requested time window and explain it
conversationally. Public RunPane commands come first. Local Pane databases,
git, GitHub, and agent transcript stores fill the gaps when RunPane doesn't
expose enough detail yet.

## Rules

- This skill is read-only. Repositories, panes, branches, PRs, deployments, and
  production systems stay as they are.
- Find the Pane data directory from `runpane doctor --json`, `PANE_DIR`, or the
  user.
- Run ordinary shell, RunPane, git, GitHub, and SQLite commands directly.
- Prefer RunPane JSON. Reading SQLite or logs directly is a fallback; say so
  and note its caveats.
- Summarize workstreams, which can differ from pane names: one pane may hold
  several PRs or follow-up tasks.
- Extract final summaries, PR URLs, checks, deploy notes, and review findings
  from agent transcripts, and quote raw transcript text only when asked.
- Name the evidence gaps: missing `archived_at`, missing GitHub auth, removed
  worktrees, transcript stores you couldn't read, or ambiguous branch matches.

## Time window

Settle the window before collecting evidence.

- An exact duration ("last 24 hours", "last 3 days") is a rolling window from
  now.
- Calendar words ("today", "yesterday", "this week") use the user's local
  calendar when known; otherwise state the timezone you used.
- An open-ended "recently" or "what have I been working on" covers active panes
  plus panes archived or updated in the last 7 days, unless the context implies
  something shorter.
- SQLite `CURRENT_TIMESTAMP` values are UTC. Say whether the times you report
  are local or UTC.

## Collect the evidence

### 1. Confirm RunPane

Start with the active Pane instance:

```bash
runpane doctor --json
```

If `runpane` isn't on `PATH` and the user is clearly inside Pane, use the
runtime guidance in the current environment. With no RunPane command at all,
say the recap can use only local files, and ask for the Pane data directory if
you can't find it.

If a later RunPane build has a recap command, use it:

```bash
runpane panes recap --since <window> --include-active --include-archived --json
```

Otherwise continue below.

### 2. Gather Pane state

Use the public commands first:

```bash
runpane panes list --json
runpane repos list --json
runpane agent-context --json
```

When these leave out archived pane history, look in the Pane data directory
that `doctor` reports, using SQLite when the schema is there:

```bash
sqlite3 "$PANE_DIR/sessions.db" ".tables"
sqlite3 "$PANE_DIR/sessions.db" ".schema sessions"
```

Useful tables, when present:

- `sessions`: pane name, status, archived flag, timestamps, worktree path,
  project ID
- `projects`: repository names and paths
- `tool_panels`: terminal, Codex, Claude, browser, explorer, and diff panels
- `session_outputs`: mostly archive operation logs; full transcripts live in
  the agent stores
- `execution_diffs` and `prompt_markers`: extra detail when present

With no `archived_at` column, use `archived = 1` plus `updated_at` as the best
proxy, and say so.

### 3. Resolve branches and PRs

For each pane or worktree:

- If the worktree still exists, run git there.
- If it was removed, use the repository path saved in Pane and infer candidate
  branches from the worktree slug and matching branch refs.
- List surviving local and remote branches with
  `git branch --all --format='%(refname:short)|%(committerdate:iso8601)|%(subject)'`.
- With `gh` authenticated, attach PRs:

```bash
gh pr list --repo <owner>/<repo> --head <branch> --state all \
  --json number,title,state,url,headRefName,baseRefName,createdAt,updatedAt,mergedAt,closedAt,author
gh pr view <number> --repo <owner>/<repo> \
  --json number,title,state,url,body,changedFiles,additions,deletions,files,commits,mergedAt,closedAt
```

List each PR from a branch separately, and separate an active pane's open PR
from its merged ones.

### 4. Find agent logs

Use transcript paths from RunPane when it provides them. Otherwise find the
local agent stores through environment variables or the standard
home-relative paths.

Codex:

- Default root: `${CODEX_HOME:-$HOME/.codex}/sessions`
- Match on `session_meta.payload.cwd`, the worktree path, the branch slug, the
  pane name, or the PR URL.
- Read with JSON filters. The useful records are `session_meta` and assistant
  `response_item` messages near the end or around PR, check, and deploy terms.

Claude:

- Default root: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects`
- Match on the worktree path slug, pane name, branch slug, or PR URL.
- Check the main `.jsonl` files and `subagents/*.meta.json` for agent roles
  such as explore, implementer, plan-reviewer, and implementation-reviewer.

For large logs, search first with `rg -l` and read only the matching files.
Useful terms: the pane slug, worktree path, branch name, PR URL, `merged`,
`deployed`, `checks`, `review`, `PostHog`, `Stripe`, `IndexNow`.

### 5. Build the recap

Group the findings:

- **Shipped or merged:** merged PRs, deploys, indexing submissions, release
  tags, and production checks.
- **Finished, not merged:** completed branches, ready PRs, passed QA, and
  archived panes without a merge.
- **Still active or open:** active panes, open and draft PRs, failing checks,
  and follow-up work.
- **Agent evidence:** which agents worked, what they did, notable review
  findings, and what review led to fixing.
- **Caveats:** missing transcript rows, reused panes, ambiguous branches,
  missing GitHub auth, and assumptions from reading the database directly.

Write it as a narrative that gives the user their memory back. A table helps
for a dense list of PRs.

## Output

Lead with the answer:

```text
You shipped three things and had one open workstream in that window.
```

Then one entry per workstream:

```text
`pane name` -> repo/branch -> PR(s)
What changed, what checks or deploys happened, and what is still open.
```

End with the quality of the evidence:

```text
I found Codex logs for all four panes and Claude logs for two. Pane's own DB
only kept archive-operation output, so the agent summaries came from the agent
transcript stores.
```

Keep it conversational and concrete. Claim completion only as far as the
evidence goes: local changes or an open PR are not shipped work.
