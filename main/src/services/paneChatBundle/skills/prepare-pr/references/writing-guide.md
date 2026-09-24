# A PR that teaches the change

The reader has the diff and this body, and no chat, private plan, or Grain
access. Follow the structure and depth below, with every example fact
replaced by evidence from the current task. Scale length
to the mechanism, not the file count: a one-line copy fix needs less than a
change with alternate paths.

## Build the explanation

Pick the explanation and visuals that make the idea easiest to grasp. Build
from first principles and let the subject set the format, in both the PR and
its Grain companion. For example:

- For a retry change, show what happens when an attempt fails, how it
  recovers, and what the person sees.
- For a permissions change, show who can see or change something, and why
  that boundary exists.
- For a performance change, show where the wait comes from and how the change
  shortens it, before any implementation detail.

1. From the ticket or discussion, pull out the trigger, the affected person,
   the intended outcome, constraints and non-goals, and the decisions. Keep
   source links or stable artifact references. Separate user decisions,
   implementation choices, and unresolved rationale.
2. Privately list every changed area and give each a place in the
   explanation. Group by behavior and dependency, not by the order you edited
   files.
3. Introduce unfamiliar entities before using them. Explain the before/after
   mechanism and why this approach meets the intended outcome. Include a
   concrete input/output example, an important boundary or failure path, and
   a diagram when it clarifies relationships. Follow the skill's
   visual-publication rules.
4. Report tests and QA separately, each with its actual commit and scope. Old
   QA may support unchanged behavior; a later fix needs its own proof. Label
   each result passing, failing, skipped, blocked, or untested. Never fill the
   template with assumed passes or invented links. State missing evidence or
   publication in the PR prose itself, where reviewers will see it.
5. Read the body as a new teammate. Can they explain why the change exists,
   how each diff area contributes, the important alternate paths, and the
   limits of the proof, without opening another artifact?

## Adaptable spine

- **Why this change exists:** source motivation, affected user, outcome, and
  relevant non-goals.
- **Concepts and approach:** entities, relationships, old behavior, chosen
  mechanism, and tradeoffs.
- **Behavior and diff walkthrough:** every changed area in dependency order,
  with concrete examples and relevant diagrams.
- **Validation and limitations:** checks and QA, tested commits, remaining
  uncertainty, and specific follow-up verification.
- **Supporting evidence:** named, verified links. The essential explanation
  stays above.

Keep repository-required sections and tracker closing lines. The headings are
a scaffold; state each fact once.

## Completed fictional example

This example shows the level of exposition. Its product facts, test results,
and URLs are fictional.

### Why this change exists

Support reports that accountants reconcile every refund by hand because the
exported ledger shows refunds as positive sales (discussion record D-17). The
requested outcome is a complete CSV with signed refund amounts. Omitting
refunds was rejected because accountants need the full ledger. This change
affects export presentation only; saved invoices and normal sale rows behave
as before.

### Concepts and approach

A transaction stores a `kind` and an amount in integer cents. The CSV
presents that amount as a decimal string. A refund is money returned, so its
exported amount must be negative. Missing data differs from a real zero: an
unknown amount exports as an empty cell.

Previously, the exporter divided every amount by 100 without looking at its
kind. It now checks for a missing amount first, then turns refunds into a
negative magnitude and formats the result. Taking the absolute magnitude
before negating also handles refunds already stored with a negative sign.

```text
Transaction → amount missing? → yes: empty CSV cell
                    ↓ no
                refund? → yes: negative magnitude → decimal string
                    ↓ no
              existing sale amount → decimal string
```

### Behavior and diff walkthrough

| Changed area | Before → after | Why it matters |
| --- | --- | --- |
| Export mapping | A refund of 1,250 cents produced `12.50`; it now produces `-12.50`. A refund stored as -1,250 cents also produces `-12.50`. | Correct sign without double-negating existing negative values. |
| Missing-amount handling | A missing amount could appear as a numeric value; it now produces an empty cell. | Preserves the distinction between missing data and a genuine zero. |
| Export-panel help | Generic download text now explains negative refunds and empty cells. | Users can interpret the output before sharing it. |
| Regression cases | Tests cover normal sales, both refund-sign inputs and missing amounts. | The suite checks the transformation and its important alternatives. |

A normal sale of 1,250 cents still exports as `12.50`. Normalizing at export
time leaves historical records untouched, at the cost of keeping the original
storage conventions. Other consumers of those records are outside this
change.

### Validation and limitations

The four regression cases and required CI passed on commit `b222222` in this
fictional record. Browser QA exercised the help text and download on
`a111111`, before the missing-value fix. That supports the observed UI
behavior, but the final blank-cell path still needs a download check on the
final commit. Import into the accountant's spreadsheet was not tested.

### Supporting evidence

The supplied screenshot and recording exist locally, but the fixture has no
successful publication record. Report publication as unavailable until
verified, and keep local paths out of upload claims. The release-asset path
remains available when Grain is disconnected.

## When the why is missing

If the ticket says only "make refunds negative," write: "The requested
behavior is signed refund exports; the originating motivation was not
supplied." Carry the gap forward, and ask when it materially affects the
approach. Leave the motivation blank: no invented accountant request, revenue
impact, or compliance driver.

## Grain companion

Link the PR description to its Grain and the Grain back to the PR. Check that
both links are clickable, including for private or unshared Grains, and keep
access settings as they are.

When Grain is connected, start from the
[bundled visual starter](../assets/pr-walkthrough.html):

- Fill its slots from the **published final PR body**, converted to semantic
  HTML. Keep every explanatory section, example, and limitation.
- Render diagrams as self-contained SVG or locally saved images, with
  descriptive text or source as a fallback.
- Add named code and evidence links.
- Put QA visuals under Validation and limitations after a plain-language
  takeaway. Link detailed reports, and optionally add a jump link at the top.

The template provides typography, responsive light and dark layout, section
navigation, evidence cards, and expandable diagrams. Fill `TITLE`, `INTRO`,
`PR_URL`, `SOURCE_SHA`, `BODY_HTML`, and `EVIDENCE_HTML`. Escape text and
attribute values, and put only trusted generated HTML into the two HTML slots.
Publish only once every slot is filled.

Keep an exact downloadable copy of the final Markdown beside the page that
matches the persisted PR body. Check the saved page's screenshots,
navigation, diagrams, and links. A saved layout or sample screenshot
says nothing about whether the current app passed QA. Follow Grain's installed
skill for destination, publication, and audience authorization. When Grain is
disconnected, use the existing durable-publication path.

## Refreshing an older PR

`prepare-pr` uses this guide automatically when the supplied URL or current
branch has an open PR; `rewrite <PR URL>` also works. Full code and branch
preparation for an existing PR needs an explicit request.

- Recover the motivating discussion or ticket and keep its source links.
- Keep accurate evidence, and explain any missing rationale.
- Replace descriptions of abandoned approaches with the final mechanism. Keep
  relevant human context and closing lines.
- A clearer explanation leaves old tests tied to their original SHA and
  missing QA still missing.
- Refresh the visual companion from the persisted rewritten body when Grain
  is connected.
- Report an editorial update without claiming the PR is ready.
