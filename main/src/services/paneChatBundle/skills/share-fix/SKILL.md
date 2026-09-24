---
name: share-fix
description: After shipping a non-trivial fix, find related GitHub issues across the ecosystem, draft helpful human-sounding comments linking the fix and root cause, and optionally file upstream issues. Drafts must pass as human writing or the user's GitHub reputation suffers. Works on the current session's fix or retroactively on past commits/PRs. Always asks for approval before posting anything public, unless the user already explicitly approved posting in the current turn.
argument-hint: "[optional: commit SHA, PR number, or description of the fix]"
---

# Share fix

## Target: $ARGUMENTS

After fixing a non-trivial bug, especially one rooted in a third-party library
or package, find other people hitting the same issue on GitHub and leave
helpful comments that point to the fix. Be a good open-source neighbor: make
the finding searchable and save other developers hours of debugging with
concrete evidence.

Use it when a merged fix works around or documents an upstream bug that other
projects likely hit. Typical triggers: a library minification bug, a terminal
emulator quirk, a polyfill issue, a build-system trap, a protocol-level
misbehavior, a platform-specific gotcha.

Work on one fix per run so research and drafting stay deep.

## Hard rules

- Never post a comment or file an issue without explicit user approval. Both
  are public and irreversible: a deleted comment still shows in issue history,
  and a filed issue still sends notifications. An explicit approval to post,
  given in the current turn, counts.
- Drafts must pass as human on first read. GitHub culture is allergic to
  AI-written content, and a comment detected as AI damages the user's
  reputation.
- Use no em dashes. Use commas, periods, colons, semicolons, hyphen-minus, or
  a sentence break. Scan every draft for `—` before presenting it and rewrite
  any you find.
- Write in first person singular: "i hit this", "i built", "my fix". Use "we"
  only when the user has said they're part of a team.
- Comment only once you can explain the root cause from the upstream source
  you read yourself.

## Voice calibration (run first)

Load voice context before drafting anything:

1. **Read memory files.** Check `~/.claude/projects/*/memory/` and any
   project-local memory for files like `feedback_comment_style.md`,
   `feedback_no_em_dashes.md`, and `user_*.md`. Read the bodies, beyond the
   MEMORY.md index. They carry the user's voice rules, honest project
   positioning, and hard writing constraints (em dashes, "we" vs "i", etc).
2. **Sample the user's recent comments in each target repo.**
   ```
   gh search issues --commenter <user> --repo <owner>/<name> --limit 10 --include-prs
   gh api repos/<owner>/<name>/issues/<n>/comments --jq '.[] | select(.user.login == "<user>") | .body'
   ```
   Read a couple of them. Match their length, lowercase pattern, shorthand,
   and emotional register.
3. **Then start step 1.** Start drafting in the user's register. A draft
   written corporate and casualized afterwards reads as "AI trying to sound
   casual".

## Step 1: Understand the fix

Read enough to explain the fix plainly:

- the commit or PR diff, the PR description, and any linked issue
- failing output, stack trace, or repro
- relevant app source
- the upstream package source or generated build output, including the
  published `node_modules` source

Extract:

- **Root cause:** the third-party behavior or bug being worked around.
- **Upstream package** and version.
- **Downstream symptom:** what end users saw.
- **Workaround mechanism:** the change that makes the symptom go away.
- **Tested alternatives** and how they rank.
- **Validation** commands and results.

Start drafting once you can explain the first four in plain language. A wrong
root cause damages the user's credibility. When the user asks for
comprehensive outreach, include the ranking of alternatives: maintainers
choosing a workaround need to know why this one is better.

## Step 2: Find outreach targets

The search is wide and benefits from parallel work across many repos.

- Claude: dispatch a `researcher` subagent.
- Codex: spawn a subagent only when the user has authorized subagents;
  otherwise research locally.

Brief the researcher on:

- the root cause in technical terms
- the symptoms in terms a lay user would use
- the upstream package and version
- search vocabulary for both technical and lay users
- the honest, non-marketing framing of the user's project, from memory

Ask for these, ranked by confidence:

1. Open or recent issues on the upstream repo matching the symptom or root
   cause.
2. Issues on downstream projects that use the same package and may have hit
   this.
3. High-traffic discussion megathreads where affected users gather. These are
   the highest-leverage targets.
4. Closed issues that are still highly reacted or searchable, where a comment
   helps future searchers.
5. The right upstream tracker for a new issue if none exists.

Each target needs a URL, issue number, match rationale, and confidence. Useful
searches:

```bash
gh search issues '"exact error text"' --include-prs --limit 100 --json repository,number,title,state,url,body,commentsCount,updatedAt,isPullRequest
gh search issues '"package name" "symptom"' --include-prs --limit 100 --json repository,number,title,state,url,body,commentsCount,updatedAt,isPullRequest
gh search issues '"protocol or internal function" "tool name"' --include-prs --limit 100 --json repository,number,title,state,url,body,commentsCount,updatedAt,isPullRequest
```

Inspect likely targets:

```bash
gh issue view <number> --repo <owner>/<repo> --comments --json title,state,url,body,comments
gh pr view <number> --repo <owner>/<repo> --comments --json title,state,url,body,comments
```

Keep only high-confidence targets. A comment on the wrong issue is worse than
no comment and lowers the signal for everyone. Check which targets the user
already commented on with
`gh search issues --commenter <user> --repo <owner>/<name>` and skip them.

## Step 3: Draft comments

Draft only at this step; posting comes after review. Reread this tone guide
every time:

- **Lowercase starts** on most sentences in informal comments, including "i".
  Some caps are fine; avoid consistent Title Case.
- **Natural shorthand:** `w/`, `rn`, `imo`, `afaik`, `tbh`, `btw`, `fwiw`,
  `repro`, `prod`, `config`, `deps`. Write `xtermjs` for xterm.js in prose,
  and `electron` and `vscode` in lowercase.
- **Short sentences mixed with the odd run-on.** Comma splices and fragments
  for emphasis are fine.
- **End when the information ends.** Drop the link, say what it does, stop.
  Leave off sign-offs, summaries, and tied-bow closers; human comments trail
  off.
- **Honest project positioning,** from memory. Describe the project
  factually: neither "small indie wrapper" nor "the leading X for Y".
- **Emotional honesty where it's natural:** "was mad enough to fix it
  myself", "took me a while to untangle". Let it show without forcing it.
- **Plain talk.** Phrases like "I wanted to share", "I hope this is helpful",
  "happy to provide more context", or "looking forward to your thoughts" are
  AI tells.
- **Prose in informal comments.** Save bullets and section headers (Summary,
  Symptom, Root Cause, Impact, Solution) for upstream issue bodies.
- **Light polish.** Slightly imperfect punctuation, like an unclosed
  parenthetical, reads more human. Leave typos out; just stop polishing early.

Shape each comment like this:

1. **Open with honest project context,** first person singular, matching the
   thread's casual tone. Example: `hey, hit the same bug in Pane (my
   cross-platform terminal-first ai code assistant manager for running claude
   code / codex in parallel worktrees).`
2. **Acknowledge the reporter** by @username in an issue thread, and credit
   workaround proposals.
3. **Explain the root cause** in short, plain paragraphs. The reader is
   technical but hasn't spent hours on this bug.
4. **Show the fix:** a snippet if small, a commit or PR link if larger.
5. **Link upstream context:** the upstream issue you filed, and adjacent
   issues or PRs.
6. **Offer an end-user workaround** if one exists for people who can't patch
   the wrapper themselves.

A short downstream comment can look like:

```text
fwiw i hit this in <project> while debugging <symptom>.

<one or two short paragraphs explaining the root cause and why their workaround is related>

the ranking i found was <best fix>, then <second fix>, then <workaround>. <link to PR>
```

Every comment adds new technical information or a concrete workaround:

- Vary wording across targets, and emphasize the slice that matters to each
  thread. Identical text in several threads reads as spam.
- In a megathread, add evidence or a fix; a "me too" adds nothing.
- Comment on a closed issue only when it helps future searchers.
- Describe what the fix covers; claim only what you tested.

Reread each draft once and ask: "would a human who just spent 6 hours
debugging this at 2am write exactly this?" Unpolish any sentence that feels
too smooth.

## Step 4: File upstream issues (if none exist)

Upstream issue bodies can be structured, so relax the lowercase casual tone.
Keep first person singular, honest positioning, no em dashes, and no
corporate sign-offs.

- **Title:** concrete and searchable, with package name, version, and the
  specific symptom.
- **Summary:** 2 or 3 sentences on the bug and who it affects.
- **Reproduction:** minimal steps.
- **Root cause:** technical analysis with a code excerpt from the upstream
  source.
- **Impact:** who hits this and under what conditions.
- **Suggested upstream fixes:** ranked options the maintainer can choose from.
- **Downstream workaround:** what consumers can do meanwhile.
- **Environment:** versions and OS.

Err toward thorough here. This is where maintainers decide whether to
prioritize the fix.

## Step 5: Review with the user, then post

Present the full plan:

- the ranked target list with confidence
- the full draft of each comment
- the full draft of any upstream issue
- the question: "approve all, approve some, edit any, or skip any?"

Once approved, post comments with a heredoc:

```
gh issue comment <n> --repo owner/repo --body "$(cat <<'EOF'
...
EOF
)"
```

File new issues the same way:

```
gh issue create --repo owner/repo --title "..." --body "$(cat <<'EOF'
...
EOF
)"
```

`gh issue comment` also works with a PR number. Confirm each post succeeded
and report the final URLs.

## Step 6: Record outreach

After posting, write `./tmp/outreach/YYYY-MM-DD-topic.md` with:

- the fix PR or commit link
- every comment URL
- any upstream issue filed
- skipped targets and why
- notable responses and any follow-up needed

The record lets later retroactive runs skip outreach already done.

## Retroactive mode

When the argument is a commit SHA, PR number, or rough description of a past
fix:

1. Find and read the commit with `git log --oneline` and `git show <sha>`.
2. Read PR context with `gh pr view <n>`.
3. If relevant, read the upstream package source as it was at fix time.
4. Run the full workflow from voice calibration onward.

For another past fix, run this skill again with that commit.

## Suggested next steps (after the run)

```
Outreach record saved to ./tmp/outreach/[filename]

Suggested next steps:
- `/share-fix <another-commit>` to retroactively share a different past fix
- Watch the filed upstream issue for maintainer response
- Check back in a few weeks to see if upstream shipped a source-level fix
```
