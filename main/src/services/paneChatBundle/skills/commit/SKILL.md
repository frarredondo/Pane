---
name: commit
description: Selectively stages and commits only the changes related to the current session, skipping unrelated modifications.
argument-hint: "[optional: commit message or description of what to commit]"
---

# Commit

Commit only the changes made in this session to the local branch, and leave
everything else alone. Classify, stage, commit, and report in one go, without
stopping for confirmation.

## Step 1: Understand what was done

1. Check `./tmp/done-plans/` and `./tmp/ready-plans/`. Read any plans there for
   file lists and feature descriptions.
2. With no plans, use the conversation history to see which files you created
   or changed, and why.
3. If `$ARGUMENTS` is given and isn't in `type: description` form, use it as
   extra context for classification in step 3.

## Step 2: Inspect all changes

1. Run `git status` for modified, added, and deleted files.
2. Run `git diff` and `git diff --cached`. Treat staged and unstaged changes as
   one pool to classify.
3. If there are no changes, say there is nothing to commit and stop.

## Step 3: Classify changes

For each changed file, staged or unstaged, decide whether this session changed
it.

Include:

- files you created or edited in this conversation
- files named in the plans you implemented (done or ready)
- supporting changes (imports, types, config) clearly tied to your work
- `./tmp/done-plans/` files and `./tmp/context.md` changes tied to your work

Leave out:

- files untouched in this conversation
- modifications that predate the session
- changes from other agents, or manual edits unrelated to your task
- unrelated `./tmp/` files (research notes, other plans)

When in doubt, include the file.

If no file is yours, say that nothing matches this session's work and stop.
Otherwise go straight to staging.

## Step 4: Stage and verify

1. Stage only your files with `git add <specific files>`. Never use `git add .`
   or `git add -A`.
2. Review `git diff --cached` for secrets or credentials:
   - API keys, tokens, passwords
   - `.env` or other credential files
   - private keys or certificates
3. If you find secrets, warn the user, unstage those files, and ask how to
   proceed. Never commit files that contain secrets.

## Step 5: Create the commit

1. Write the message:
   - If `$ARGUMENTS` is in `type: description` form (for example
     `feat: add commit skill`), use it verbatim.
   - Otherwise derive one from the work: `type: short description` (feat,
     fix, refactor, docs, chore), imperative mood, under 72 characters.
   - Add a bulleted body when the commit covers several logical changes.
2. Commit to the local branch. Leave pushing to `prepare-pr`.

## Step 6: Report

Suggest `/commit` again only if uncommitted files remain.

```
Committed: <short sha> <commit message>

Files included:
  - <file list>

Files left uncommitted:
  - <file list, or "none">

Next steps:
  - `/prepare-pr` - Rebase, build, and open a PR
```
