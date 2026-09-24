---
name: investigate
description: Investigates bugs through hypothesis-driven root cause analysis and reports what is wrong before any fix. Automatically invoked when the user reports a bug, error, broken behavior, or something not working as expected. Use when something is broken, failing, or behaving unexpectedly.
argument-hint: "[bug description, error message, or unexpected behavior]"
---

# Investigate

Find the root cause of this bug and report it to the user.

Your job is to find and explain the problem. Leave the fix for later. The only
code you add is diagnostic logging, and only with the user's approval. Back
every conclusion with evidence from code, logs, or commands.

## Phase 1: Understand the bug

If `$ARGUMENTS` leaves them out, ask for:
- expected behavior
- observed behavior
- steps to reproduce

### Categorize the bug

Classify the issue early. Each type calls for a different strategy:

| Category | Investigation Strategy |
|---|---|
| **Type / Compilation Error** | Check recent type changes, inference chains, tsconfig, package versions |
| **Logic Error** | Trace data flow, check conditionals, compare with working code paths |
| **Race Condition / Timing** | Look for shared state, async patterns, missing awaits, event ordering |
| **State Management** | Trace state mutations, check store subscriptions, verify update propagation |
| **Integration / API** | Check API contracts, data transformations, request/response shapes |
| **Environment / Config** | Check env variables, config files, dependency versions, build settings |
| **UI / Rendering** | Check component props, conditional rendering, CSS specificity, hydration |

### Verify reproduction

Before investigating:
- Confirm you know how to trigger the bug.
- Note whether it's consistent or intermittent.
- If reproducing it needs a running application, tell the user. They may need
  to reproduce it and send logs.

## Phase 2: Form hypotheses

Before reading code, list 3-5 possible causes ranked by likelihood, based on
the bug description, error messages, and common failure patterns:

```
Hypotheses (ranked by likelihood):
1. [Most likely cause] - because [reasoning]
2. [Second most likely] - because [reasoning]
3. [Third most likely] - because [reasoning]
...
```

A ranked list keeps you from locking onto the first plausible explanation. Test
each one systematically.

## Phase 3: Investigate the root cause

Trace the code to test your hypotheses. Use the `codebase-explorer` skill or an
explorer subagent (Claude: `Explore`) for broad searches, and read files
directly for targeted analysis.

### Techniques, most effective first

1. **Trace backward from the error.** Follow the call stack from the symptom to
   its origin.
2. **Check recently modified files first.** Most bugs live in recent changes.
   Use `git log --oneline -20 -- [relevant paths]`.
3. **Compare working and broken paths.** Find similar working code and list
   every difference.
4. **Trace data across boundaries.** Follow transformations between services
   and components (API → service → repository, or parent → child →
   grandchild).
5. **Check git blame and log.** Find the commit that introduced or changed the
   broken behavior.

### What to find

- **What's wrong**: the specific code causing the incorrect behavior.
- **When and how it was introduced**: the commit, PR, or change.
- **Why it happened**: the underlying reason, such as a missed edge case, a
  wrong assumption, or an incomplete refactor.

### If the code makes the cause clear

Tell the user right away, then go to Phase 5.

### If the cause is still unclear

Tell the user:
- what you've investigated so far
- which hypotheses you've ruled out, and why
- what remains unclear

Then propose diagnostic logging. Explain what you want to log and why, and wait
for approval.

## Phase 4: Diagnostic logging (only if needed)

Enter this phase only when Phase 3 didn't find the cause.

1. Add targeted `console.log` statements prefixed with `[DEBUG-FIX]` to the
   suspected code paths.
2. Ask the user to reproduce the bug and paste the relevant logs.
3. Analyze the logs:
   - **Root cause found**: tell the user, then go to Phase 5.
   - **Still unclear**: explain what you learned, refine the hypotheses,
     propose more logging, and repeat with approval.

### When you're stuck

After 3 or more inconclusive cycles (hypothesis, test, no answer):

1. **Summarize what's ruled out**: every hypothesis tested and the evidence
   against it.
2. **Change approach.** Form a new theory. Consider:
   - Is the bug in a different layer than assumed (backend or frontend,
     database or application)?
   - Could it be an environment or infrastructure issue?
   - Is there a timing or race condition that appears only under specific
     conditions?
3. **Ask the user.** They may have domain knowledge that changes the direction.

## Phase 5: Report and next steps

Once you've found the root cause, present:

```
## Investigation Report

**Root cause:** [one-line summary]
**Confidence:** [High / Medium / Low] - [brief justification]

**File(s):** [affected files with line numbers]
**Introduced:** [commit hash / PR / approximate timeframe if known]

**What needs to change:**
- [description of the fix needed]

**Why this happened:**
- [brief explanation of the underlying cause - missed edge case, wrong assumption, incomplete refactor, etc.]

**Next steps:**
- `/create-plan [description]` - Create a fix plan
- `/simple-plan [description]` - Quick fix plan if it's straightforward
```

If you added diagnostic logs in Phase 4, remove every `[DEBUG-FIX]` log before
finishing.

## Red flags

Stop and reassess if you catch yourself:

- proposing a fix before identifying the root cause
- assuming a cause without evidence from the code
- investigating code unrelated to the reported symptoms
- testing variations of a failed hypothesis
- saying "let's just try changing X and see if it works"
- spending a long time without reporting intermediate findings

Bug to investigate: $ARGUMENTS
