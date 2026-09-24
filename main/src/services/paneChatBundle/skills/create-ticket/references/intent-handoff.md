# Preserve intent at ticket handoff

- Use **Intent**, **Scope**, and **Acceptance Criteria**. Add **Inputs Needed**,
  **Starting Points**, and **Decision History** where they help.
- Keep the user's language and constraints. Ground each requirement in a source,
  and label facts, decisions, proposals, and open questions as such.
- Capture the trigger, the expected and actual behavior, and the consequence,
  or the unmet need for a new idea. Attribute reports, and label suspected
  causes and unmeasured impact.

## Complete source

Fictional source D-17: "Accountants reconcile every refund manually because our
CSV shows it as a positive sale. Keep all rows; show refunds as negative
amounts. Limit this to exports; preserve saved invoices. Missing amounts should
be blank."

- **Intent:** Accountants receive a complete ledger they can reconcile
  directly.
- **Scope:** Export refund amounts with the correct sign and explain the
  convention in export help. Keep every row, normal sales, and saved invoices
  as they are.
- **Acceptance criteria:** A 1,250-cent refund exports as `-12.50`, including
  when its stored sign is already negative. A normal sale exports as `12.50`.
  A missing amount exports as an empty cell.
- **Sources:** D-17. Link it when you can; an identifiable discussion reference
  works when the source has no shareable URL.

## Evolving intent

Fictional follow-up D-18: "The finance team imports these into a tool that
expects separate sale and refund columns. Use that format instead, and keep
both amounts positive. The goal is still reconciliation."

- **Current what:** Export separate sale and refund columns with positive
  amounts.
- **Current why and outcome:** Finance imports a complete ledger into its tool
  and reconciles it directly.
- **Kept constraints:** Every row stays, saved invoices stay as they are, and
  missing amounts stay blank.
- **Updated acceptance criteria:** A 1,250-cent refund appears as `12.50` in
  the refund column, a normal sale appears in the sale column, and missing
  amounts stay blank.
- **Inputs Needed:** Confirm what the other column holds. A blank cell is a
  proposed convention until confirmed.
- **Decision history:** D-17 asked for signed amounts. D-18 replaces that
  format because the receiving tool expects separate columns. The
  reconciliation goal still holds.
- **Handoff:** Update the existing issue and the same Grain brief, replace the
  superseded acceptance criteria, and keep this short history.

Treat a changed motivation or outcome the same way: label the earlier goal as
superseded, cite the new decision, and refresh the scope and success criteria.

## Incomplete source

Source: "Make refund exports negative."

- **Known what:** Export refunds as negative amounts.
- **Inputs Needed:** What prompted this, who is affected, and what would
  successful use look like? Ask about the open decisions that affect scope.
- **Evidence boundary:** The accountant story, the saved-invoice constraint,
  and the empty-cell rule belong to D-17. This request's requirements come from
  its own sources.

## Observation before solution

Fictional source D-19: "I changed one sentence, clicked Save, and saw the whole
document in the request. Add patches to cut editing costs."

- Check the editing path, the existing options, and the actual cost before
  choosing between guidance, investigation, or patches.

## One outcome or several

For "capture this discussion in Grain", save the brief there. For "give support
the copy change and engineering the export fix", create a separate artifact for
each outcome and link the shared rationale. Pick ticket-only, Grain-only, or
both from the request.

## Refine with the human

- Ask: "What happened last time?", "What would a good result enable?", "What
  would make the existing approach enough?" Look up the facts yourself; product
  choices belong to the user.
- Show the proposed experience, alternatives, and tradeoffs with a useful
  example or mockup. Label uncertainty and fidelity limits, and leave
  implementation steps to planning.

## Explain enough to delegate

Lead with the real-world problem and the result you want. A before-and-after
example, a simple flow, or a decision timeline helps when it shows a
relationship that matters. Let the subject pick the format.

Each artifact should work on its own. When you use both GitHub and Grain, put
the same intent, scope, acceptance criteria, and material decision changes in
both, for readers with different access.

### Include the approved mockup

- Offer `ui-mockup` for UI changes; a direct request counts as accepting. If it
  is declined or unavailable, continue the ticket and note any visual gap that
  matters.
- In Grain, place a **Design reference** next to the proposed experience,
  before the detailed acceptance criteria. Save the image in the same workspace
  with its caption, version and approval status, final prompt, and source
  references.
- In GitHub or another tracker, place **Design reference** after Scope and
  before Acceptance Criteria. Embed a verified, durable attachment suited to the
  audience, or link the existing authorized artifact. Link private Grain URLs as
  brief links, and keep local files until the upload succeeds.
- Describe the approved behavior in text and keep it consistent with the image;
  incidental generated details are illustration. Name the selected version and
  the earlier drafts. Apply the same placement in other destinations.
