---
name: site-content-audit
description: "Audit a site, sitemap, content section, competitor, or URL portfolio for SEO and content quality patterns. Use for ClickUp-style traffic-loss forensics, sitemap XML analysis, Ahrefs, Semrush, or GSC export analysis, SERP replacement analysis, template-footprint risk, competitor teardown, pruning, merging, rewriting, refreshing, redirecting, or recovery sequencing."
---

# Site content audit

Use this skill when the unit of analysis is bigger than one page: a sitemap,
content section, competitor, traffic decline, template family, or URL
portfolio.

Core rule: separate demand loss from ranking loss first. Attribute a decline to
AI overviews, Google updates, backlinks, or topical breadth only after the
evidence shows whether traffic disappeared or moved elsewhere.

## Inputs to gather

- Sitemap XML, sitemap index, URL list, or crawl export.
- Optional traffic or ranking exports from GSC, Ahrefs, Semrush, or similar
  tools.
- Date range and known traffic-change dates.
- Competitor URLs or current SERPs for important lost queries.
- Sample HTML or pages from winners and losers.
- Product scope and content strategy context.

Prefer local files and exports the user supplies. Use public web research or
official Google sources when current update timing or policy language matters.

## Scripts

- `scripts/sitemap_inventory.py`: parse sitemap XML and indexes from a file or
  URL into CSV or JSON.
- `scripts/content_fingerprint.py`: analyze HTML files or URLs for title, H1,
  and schema basics, CTA and product-promo phrases, repeated headings, product
  mentions, and template markers.
- `scripts/merge_search_exports.py`: merge URL inventories with optional search
  exports, using tolerant column mapping.
- `scripts/portfolio_triage.py`: sort URL or export rows into keep, refresh,
  rewrite, merge, prune, redirect, or manual-review buckets.

Run the scripts when they save real manual work. Analyze small inline data
directly.

## Workflow

1. Build or inspect the URL inventory. Use `sitemap_inventory.py` when sitemap
   or XML parsing is needed.
2. Segment URLs by section, template, topic, intent, product fit, and page
   type.
3. Merge traffic and ranking exports if available, using
   `merge_search_exports.py`.
4. Distinguish ranking loss, demand loss, and traffic transfer. Load
   [serp-replacement-logic.md](references/serp-replacement-logic.md).
5. Sample winners and losers. Use `content_fingerprint.py` to find repeated
   promotional, technical, or template patterns.
6. Evaluate section and template risk. Load
   [template-footprint-risk.md](references/template-footprint-risk.md).
7. Map each URL or group to an action. Load
   [portfolio-action-matrix.md](references/portfolio-action-matrix.md).
8. Calibrate findings against good and bad editorial systems. Load
   [good-vs-bad-examples.md](references/good-vs-bad-examples.md).
9. Produce a prioritized audit with evidence strength, following
   [site-audit-workflow.md](references/site-audit-workflow.md).

## Output format

Return:

- Scope and data sources
- Key caveats and missing evidence
- Loss or audit map by section, template, topic, intent, and product fit
- SERP replacement findings
- Technical, editorial, and promotional fingerprints
- Root-cause hypotheses ranked by evidence strength
- URL action buckets
- Recovery sequence
- Follow-up data needed

Claim causality only as far as the evidence reaches. Mark update correlation,
backlink changes, and AI cannibalization as hypotheses unless query-level and
SERP-level evidence supports them.
