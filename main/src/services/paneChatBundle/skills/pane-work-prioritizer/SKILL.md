---
name: pane-work-prioritizer
description: Recommend what to work on next across a Pane workspace and GitHub activity. Use when the user asks what to work on next, what to prioritize, what is blocked, what needs review, which PRs should be merged, which issues matter, or wants a triage of active and recent repos, panes, PRs, issues, checks, reviews, and recent work.
---

# Pane Work Prioritizer

Rank the user's next work across Pane and GitHub. Combine active Pane context,
recent repository activity, open PR state, review requests, assigned issues,
CI, review comments, and recency into a short recommendation: what to do first,
and what to leave for now.

## Rules

- Stay read-only unless the user explicitly asks you to comment, assign, close,
  merge, rebase, start panes, or change code.
- Give a ranked recommendation. Include only as much inventory as supports it.
- For each ranked item, name the skill or workflow to use next (see the map
  below).
- Use current GitHub and RunPane state. If GitHub auth, RunPane, or local
  repository data is unavailable, say which signal is missing.
- Judge urgency from labels, PR state, checks, recency, active panes, business
  impact, and blockers. Being assigned is one signal among these.
- Confirm that work is live from branches, PRs, agent logs, and recent updates;
  a pane name or an old branch alone doesn't show it.
- Add a "probably not next" list when the queue is noisy.
- Respect a scope the user gives. By default, cover active panes, panes
  recently updated or archived, the 10 most recently active repositories, and
  GitHub queues across the repositories the authenticated user can see.

## Collect the signals

### 1. Identity and scope

Use the authenticated GitHub user when available:

```bash
gh auth status
gh api user --jq '.login'
```

"Next" with no time frame means current state plus recent activity. With a
time period, use it to choose recent repositories and Pane activity, and still
include review requests and open PRs that block someone now.

### 2. Pane and local repository signals

Start with the public RunPane commands:

```bash
runpane doctor --json
runpane panes list --json
runpane repos list --json
runpane agent-context --json
```

Without RunPane, fall back to local git repositories in the current workspace
and the user's usual checkout folders, found relative to `$HOME`.

For each candidate repository, record:

- active or recently archived panes tied to it
- the last local commit or update time
- current branch names, and whether their worktrees still exist
- branch or PR URLs from agent logs, when the user asked for Pane-aware
  prioritization

### 3. GitHub queues

Check review requests first:

```bash
gh search prs --review-requested=@me --state=open --archived=false \
  --json repository,number,title,url,author,updatedAt,isDraft --limit 100
```

Then the user's open PRs and assigned issues:

```bash
gh search prs --author=@me --state=open --archived=false \
  --sort updated --order desc \
  --json repository,number,title,url,author,updatedAt,isDraft --limit 100

gh search issues --assignee=@me --state=open --archived=false \
  --sort updated --order desc \
  --json repository,number,title,url,updatedAt,labels,author --limit 100
```

In the recent repositories, also list open PRs, since teammates' PRs can need
attention without a formal review request:

```bash
gh pr list --repo <owner>/<repo> --state open \
  --json number,title,url,isDraft,author,updatedAt,reviewDecision,mergeStateStatus,labels --limit 50
```

For the top candidates, get the details:

```bash
gh pr view <number> --repo <owner>/<repo> \
  --json number,title,url,isDraft,author,updatedAt,reviewDecision,mergeStateStatus,statusCheckRollup,latestReviews,reviews,reviewRequests,comments,labels
```

- `statusCheckRollup` separates passing, failing, pending, skipped, and unknown
  checks.
- Search results omit `reviewDecision`, so add it with `gh pr list` or
  `gh pr view` before ranking your own PRs by review state.
- `latestReviews` and `reviews` give review decisions and review-body findings.
- `comments` covers top-level PR discussion only. When the ranking depends on
  inline review comments, fetch them:

```bash
gh api repos/<owner>/<repo>/pulls/<number>/comments --paginate
```

Summarize long bot reviews in a line.

### 4. Map each item to a skill

- Unknown failure, crash, or regression: `investigate`.
- Fuzzy product idea or broad feature: `discussion`, then `create-ticket`.
- Clear implementation issue: `create-plan` or `simple-plan`, then `implement`.
  In a Pane Session, `astra-ticket` after `create-ticket`.
- Finished branch that needs confidence: `review` (Codex:
  `implementation-reviewer`), then `pr-test-automation`.
- Branch ready to become a PR: `prepare-pr`.
- Open PR with review findings: `implement` for the fixes, then review again.
- PR that is ready but untested: `pr-test-automation`.
- Public docs, support copy, SEO, or a marketing page: `page-strategy`,
  `page-review`, or `site-content-audit` before implementation.
- Business-facing artifact: `business-context`, `business-discussion`,
  `business-spec`, `business-artifact`, then `business-artifact-reviewer`.
- Finished non-trivial work: `teach-back`, and `share-fix` only after explicit
  approval to post externally.

### 5. Rank

Use this order as a starting point, then explain your judgment:

1. Explicit review requests, production incidents, security issues, billing or
   migration blockers, failed releases, and broken deploys.
2. Recent open PRs close to shipping: passing checks, not drafts, recent
   updates, clear review status, and a small follow-up left.
3. High-impact draft PRs waiting on a decision: QA done, checks passing, or one
   human or product choice left before review.
4. Active Pane workstreams with recent agent activity and a clear next action.
5. Assigned P0 and P1 issues, especially ones labeled bug, security,
   reliability, data loss, billing, or customer-facing.
6. Large backlog waves, stale PRs with conflicts, old drafts, and personal
   experiments, once the above are clear.

When two items compete, finish the work already near merge before starting new
backlog work, unless the new issue is a real incident or business blocker.

## Output

Lead with the answer:

```text
I would work on <item> first, then <item>. The main reason is that your review
queue is empty, but these two PRs are already close to shipping.
```

Then 3 to 7 ranked items, each with:

- the repository and PR or issue URL
- why it ranks there
- one concrete next action
- the next skill or workflow
- any blocker or uncertainty

Add a short "probably not next" section for noisy backlog, stale PRs, or
repositories with nothing actionable.

End with the evidence you used:

```text
Signals used: active panes, last 10 recent repos, GitHub review requests,
open authored PRs, assigned issues, PR checks, and review comments. I could not
read archived pane logs, so I did not use them as proof of completion.
```

Keep it conversational and focused on judgment.
