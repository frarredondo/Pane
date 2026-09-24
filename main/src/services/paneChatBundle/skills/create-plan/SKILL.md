---
name: create-plan
description: Creates a reconciled implementation plan by combining a structured plan draft with a normalized intent brief and a PRP-style research dossier, then auto-reviews the final plan. Use when planning a new feature or significant change.
argument-hint: "[feature description or ticket reference]"
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch, Write, Task
---

# Create plan

## Feature: $ARGUMENTS

Write a complete, well-researched implementation plan. It must carry enough
context for an AI agent to implement the feature in one pass.

You are the primary planner. When another agent is available (Codex for
Claude, a Claude workflow for Codex), it serves as a second-opinion review
lane in step 5.

## Step 1: Audit the repo

Verify the current repo shape for the feature area before drafting.

### Facts to verify in the repo

- Primary entry points and integration surfaces for this feature
- Exact module names and singular or plural usage
- Validator, controller, and service directory layout in the affected area
- The data-model, schema, or type source of truth this codebase uses
- Existing user-facing or operator-facing surfaces this feature extends
- Shared type and export hubs, if cross-app types are needed
- The repo's actual validation, build, and typecheck workflow

### Audit rules

- Discover the repo's actual routing, validation, schema, frontend, and build
  patterns. Assume no particular stack or layout.
- Open every existing file path you cite in the final plan during this
  session.
- Mark every path in the final plan `existing` or `new`.
- Cite a line number only after verifying it in the current checkout.
- Keep template and example paths out of the final plan.
- If the brief or request conflicts with the repo, add a `Known Mismatches /
  Assumptions` section that states the conflict and how the plan resolves it.

## Step 1b: Clarify requirements if needed

If the approach is still genuinely unclear after the audit, ask the user 1-3
targeted design questions. Otherwise, go straight on.

## Step 1c: Research externally if needed

- Library documentation, with specific URLs
- Implementation examples
- Best practices and common pitfalls

Prefer primary documentation for external behavior.

## Step 2: Draft the plan, intent brief, and research dossier

Produce three artifacts from the same brief:

1. A provisional implementation plan, using [plan_base.md](plan_base.md) in
   this skill's folder as the template.
2. A normalized intent brief that keeps the why, locked decisions, non-goals,
   and success criteria in a compact form for downstream steps.
3. A PRP-style research dossier: dense with anchors, selective, and focused on
   context transfer.

The user sees the reconciled plan. The dossier supports it.

### Step 2a: Draft the provisional plan

The implementing agent gets only the plan and codebase access. Include:

- **Intent / Why**: the user outcome, the business or product reason, and what
  must survive any optimization
- **Verified Repo Truths**: checked facts only, grouped by area
- **Evidence**: exact `file:line-line` support for factual claims, plus search
  evidence for negative claims
- **Locked Decisions**: product and design choices the brief or user already
  settled
- **Documentation**: URLs with specific sections
- **Code Examples**: real snippets from the codebase
- **Gotchas**: library quirks, version issues
- **Patterns**: existing approaches to follow
- **Known Mismatches / Assumptions**: brief-vs-repo conflicts or explicit
  assumptions
- **Critical Codebase Anchors**: the repo anchors an implementer should keep
  open while coding

For the implementation blueprint:

- Start with pseudocode showing the approach.
- Reference real files for patterns.
- Include the error-handling strategy.
- List tasks in implementation order.

### Plan rules

Fill every required section: Summary, Intent / Why, Source Artifacts, Verified
Repo Truths, Locked Decisions, Known Mismatches / Assumptions, Critical
Codebase Anchors, Files Being Changed (a tree with ← NEW / ← MODIFIED
markers), Reconciliation Notes, Delta Design, Architecture Overview
(proportional to complexity), Key Pseudocode (hot spots and tricky logic
only), Tasks (concrete file-level steps in order), Validation, and Open
Questions.

Facts:

- `Verified Repo Truths` holds only facts checked in the current repo.
  Proposed files, pseudocode, and guesses go elsewhere.
- Write each bullet in this shape:
  - `Fact: ...`
  - `Evidence: path:line-line`
  - `Implication: ...`
  - `Search Evidence: ...` for absence or negative claims such as "does not
    exist", "is never used", or "no X today"
- Move any unproven claim to `Delta Design`, `Known Mismatches /
  Assumptions`, or `Open Questions`.
- Keep proposal wording ("we add", "we extend", "this plan", "for this
  feature", "will") out of `Verified Repo Truths`. Proposed work goes in
  `Delta Design`, `Tasks`, and pseudocode.

Paths and code:

- Every `MODIFY` path already exists. Every `CREATE` path fits the repo's
  directory conventions.
- Use only verified paths. Remove `<feature>`, `path/to/example.ts`,
  `existing-service.ts`, and any other illustrative template path.
- Mirror the repo's helper and naming patterns in every schema, validator,
  type, or code snippet.

Scope:

- Replace things completely. Add shims, fallbacks, re-exports, or
  compatibility layers only when the user asks for them.
- End with a section that removes code this plan makes unused.
- Leave unit and integration test creation out of the plan unless the user
  asks for tests.
- Where a requirement, design decision, or implementation detail is unclear,
  insert a `[NEEDS CLARIFICATION]` marker saying what is unclear and why it
  matters. Resolve every marker with the user before finalizing.

### Step 2b: Write the intent brief

Save it as `./tmp/plan-artifacts/YYYY-MM-DD-description-brief.md`.

This is a compact intent capsule for implementation and review, not a copy of
the request. Include:

- Problem and outcome summary
- Who this matters for
- Locked decisions already made
- Non-goals, and what must survive any optimization
- Success criteria
- Explicit user constraints

Record this path in the final plan's `Source Artifacts` section so later
skills can reload it.

### Step 2c: Build the research dossier

Save it as `./tmp/plan-artifacts/YYYY-MM-DD-description-research-dossier.md`.

Claude: spawn one fresh `research-dossier-writer` subagent from the same
brief. Codex: write the dossier yourself.

The dossier:

- supports the plan; you write the final plan
- focuses on codebase anchors, patterns to reuse, gotchas, external docs, and
  a suggested implementation shape
- uses exact `file:line-line` references for repo claims
- includes external docs only when they improve accuracy or reduce
  implementation risk
- uses real examples throughout, with no placeholder text

Suggested subagent prompt:

```
Task tool:
  subagent_type: "research-dossier-writer"
  prompt: "Create a PRP-style research dossier for [feature]. Save it at
    [dossier path]. Focus on critical codebase anchors, patterns to reuse,
    gotchas/load-bearing decisions, useful external docs when needed, and a
    suggested implementation shape. Use exact file:line-line references for repo
    claims. Do not write the final implementation plan."
```

Keep the dossier concise and evidence-backed, tuned for context transfer over
section completeness.

## Step 3: Reconcile the dossier into the plan

Before saving, compare the provisional plan with the dossier.

Goals:

- Import missing anchors, docs, gotchas, and load-bearing constraints from the
  dossier.
- Keep the brief's why, locked decisions, and non-goals as first-class
  constraints.
- Surface factual conflicts between the draft and the dossier.
- Remove duplicated or low-value sections that add length without reducing
  risk.
- Keep verified facts, settled decisions, and proposed changes separate.

Rules:

- The final plan is authoritative. The dossier is supporting evidence.
- The intent brief is authoritative for the why. Keep plan convenience from
  quietly weakening it.
- Import selectively: only the highest-value anchors, patterns, docs, and
  gotchas.
- When the plan and dossier disagree, re-check the repo before choosing.
- When a simplification weakens the brief's intent, or a conflict stays
  unresolved, put it in `Known Mismatches / Assumptions` or `Open Questions`.
- Import a dossier claim into `Verified Repo Truths` only with its evidence.
- Add a short `Reconciliation Notes` section listing:
  - anchors or docs imported from the dossier
  - conflicts resolved
  - dossier content dropped as duplicate or low-value

### Pre-save reality check

Before saving, confirm:

- Every `MODIFY` path exists in the repo.
- No placeholder or example paths remain.
- Every line anchor was checked in the current checkout.
- Every `Verified Repo Truths` bullet has `Fact`, `Evidence`, and
  `Implication`.
- Every negative or absence claim has `Search Evidence`.
- `Verified Repo Truths` has no future or proposal wording.
- Entry points and integration points match the wiring found in the audit.
- Code examples match current helper patterns exactly.
- The dossier was compared with the provisional plan.
- Every plan-vs-dossier factual conflict is resolved or surfaced.
- Every imported anchor, doc, and gotcha is concrete and evidence-backed.
- A reviewer can tell repo facts from proposed changes.
- No factual blockers from the review remain.

Grep for these before finalizing:

- `<feature>`
- `path/to/example`
- `Task N:`
- `\[actual `
- bullets in `Verified Repo Truths` missing `Evidence:`

## Step 4: Save the plan and supporting artifacts

- Final reconciled plan: `./tmp/ready-plans/YYYY-MM-DD-description.md`
- Research dossier:
  `./tmp/plan-artifacts/YYYY-MM-DD-description-research-dossier.md`
- Intent brief: `./tmp/plan-artifacts/YYYY-MM-DD-description-brief.md`

Only the reconciled plan goes in `ready-plans`.

## Step 5: Review and present

After saving, run the review gates. They are required.

1. **Primary review lane.** Claude: spawn a `plan-reviewer` subagent. Codex:
   run a skeptical review against the `plan-reviewer` skill's standards, in a
   fresh context when you can.

```
Task tool:
  subagent_type: "plan-reviewer"
  prompt: "Review the plan at [plan path]. Supporting research dossier:
    [dossier path]. Supporting brief / intent artifact: [brief path]. Audit
    `Verified Repo Truths` first. Verify every factual claim against the
    current codebase, require exact evidence for each fact, require search
    evidence for negative claims, and flag any proposal language that leaked
    into fact sections. Then compare the final plan against the supporting
    brief: flag lost intent, weakened locked decisions, or dropped non-goals.
    Then compare it against the supporting dossier: flag missing anchors,
    missing gotchas/docs, factual conflicts, unsupported imported claims, and
    duplicated or low-value sections that survived reconciliation. Finally
    verify existing file paths, anchors, module names, integration points, and
    code examples. Produce a numbered list of specific, actionable
    recommendations covering repo-accuracy issues first, then brief-fidelity
    issues, then reconciliation issues, then gaps, simplification
    opportunities, correctness issues, and better alternatives."
```

2. **Second-opinion lane, when available.** Run it in parallel with the
   primary lane.
   - Claude: if the Codex plugin is available, launch a fresh, xhigh-effort
     rescue run so Codex audits the saved plan against the current repo:

```
/codex:rescue --wait --fresh --model gpt-5.6-sol --effort xhigh audit the plan at [plan path] against the current repository and the supporting brief at [brief path]. Focus on ghost paths, missing runtime wiring, auth/permission gaps, transaction boundaries, async/job registration, query params or routes with no consumer, brief-to-plan intent drift, and any task definitions that are likely to let an implementation stop short of the finish line. Return numbered findings with exact file references when possible and say explicitly whether the plan seems implementation-ready.
```

   - Codex: a separate Claude workflow, if you have one, can serve as this
     lane.
   - With no second lane, the primary review is the gate.

   Wait for every active lane to finish before continuing.

3. **Triage and apply.** Sort the combined findings into two buckets:
   - **Auto-fixable**: missing details, small corrections, and obvious
     improvements that need no design decision. Apply these to the plan
     silently.
   - **Needs user input**: requirements questions, design trade-offs,
     ambiguous scope, or anything with several valid approaches.

   Hold all questions until every active lane is done. Merge overlapping
   findings and present one combined set.

4. **Present to the user:**

   **a) Plan summary**: 3-5 bullets on what the plan does.

   **b) Questions for you**: only combined findings that need the user's
   input. For each one, give:
   - the reviewer's question or concern
   - **Context**: what the surrounding functionality does and why this
     matters, citing specific files, patterns, or behaviors

   If everything was auto-fixed, say "Reviewer feedback was minor and has been
   incorporated." Say so explicitly if factual blockers existed and were
   fixed, and if the Codex audit ran and was minor.

   **c) Plan link:**
   ```
   Plan: ./tmp/ready-plans/[filename]
   ```

   **Optional supporting artifact links:**
   ```
   Brief / intent artifact: ./tmp/plan-artifacts/[brief-filename]
   Research dossier: ./tmp/plan-artifacts/[dossier-filename]
   ```

   **d) Next step**: always end with "Want to run another review pass, or is
   this ready to implement?"

5. **If the user wants changes or another pass:** apply the requested changes,
   then repeat from item 1 with a fresh `plan-reviewer` and, when available, a
   fresh second-opinion lane in parallel. Fresh lanes judge the current state
   without bias.

6. **If the user says it's ready:** go to step 6.

The plan is ready only when every factual blocker is resolved.

## Step 6: Hand back the plan

Once the user confirms the plan is ready, tell them:

```
Plan finalized! To implement, run:

/implement ./tmp/ready-plans/[filename]

Explicit Claude executor:
/implement claude ./tmp/ready-plans/[filename]

Optional Codex executor (gpt-5.6-sol, medium; use xhigh for harder work):
/implement --codex ./tmp/ready-plans/[filename]
```

Codex: show only the first command.

Your job ends here. Never implement the plan yourself: no implementer agents
and no application code changes. This skill produces a plan file; the user
starts implementation separately with `/implement`.

## Quality checklist

- [ ] All necessary context included
- [ ] Research dossier created
- [ ] Intent brief created
- [ ] Existing file paths verified in this session
- [ ] No placeholder or example paths leaked from the template
- [ ] Plan includes `Intent / Why` and `Source Artifacts`
- [ ] Verified Repo Truths contains facts only
- [ ] Every verified fact has exact evidence
- [ ] Every negative claim has search evidence
- [ ] High-value anchors, docs, and gotchas from the dossier were reconciled
      into the plan or deliberately dropped
- [ ] The brief's why, locked decisions, and non-goals survived reconciliation
- [ ] Plan-vs-dossier factual conflicts were resolved or surfaced
- [ ] Dossier claims imported as facts all carry evidence
- [ ] Second-opinion lane completed, or skipped because none was available
- [ ] Validation gates are executable by an AI agent
- [ ] Existing patterns are referenced
- [ ] Clear implementation path
- [ ] Error handling documented
- [ ] Files Being Changed tree filled in
- [ ] Architecture overview explains the big picture
- [ ] Key pseudocode covers the hot spots
- [ ] Integration points and naming match the repo
- [ ] No unresolved `[NEEDS CLARIFICATION]` markers

Score the plan 1-10 for confidence in one-pass implementation.

## Plan lifecycle

- **Active plans**: `./tmp/ready-plans/`
- **Supporting artifacts**: `./tmp/plan-artifacts/`
- **Completed plans**: `./tmp/done-plans/` (moved after successful
  implementation)
- **Cancelled plans**: `./tmp/cancelled-plans/` (moved if abandoned)
