---
name: page-review
description: "Review and improve a draft or live content page. Use when the user wants cleanup for usefulness, voice, E-E-A-T, intent match, answer quality, promotional risk, self-promotion fairness, comparison or listicle integrity, proof gaps, CTA placement, or a ship, revise, or do-not-ship publishing judgment."
---

# Page review

Use this skill once a draft or live page exists. Judge whether the page serves
the reader before it tries to convert them.

Core rule: the page should stay useful with every CTA and product promo block
removed. If removing promotion leaves a thin or distorted answer, recommend
revision before shipping.

## Inputs to gather

- Draft text, live URL, exported HTML, or page outline.
- Target query or keyword, and the intended audience.
- The product or offer being promoted.
- Page goal and funnel stage.
- Competitors or SERP examples, if available.
- Known constraints: claims, compliance, brand voice, required CTAs, or proof
  assets.

If the target query is missing, infer it from the title, H1, and body, and flag
the uncertainty.

## Workflow

1. Identify the promised answer and the searcher job.
2. Score usefulness, intent fit, voice, E-E-A-T and proof, freshness, time to
   value, CTA risk, and answer distortion. Load
   [page-review-rubric.md](references/page-review-rubric.md).
3. For comparisons, listicles, alternatives pages, and roundups, check that
   self-promotion follows the rules applied to competitors. Load
   [self-promotion-fairness.md](references/self-promotion-fairness.md).
4. Clean up voice: specificity, firsthand judgment, tradeoffs, stale claims,
   generic phrasing, and fake neutrality. Load
   [editorial-voice.md](references/editorial-voice.md).
5. For listicles, comparisons, product-led informational pages, or pages with
   heavy CTAs, calibrate against
   [good-vs-bad-examples.md](references/good-vs-bad-examples.md).
6. Produce a publish decision and concrete rewrite priorities.

## Output format

Return:

- Recommendation: `ship`, `revise`, or `do not ship`
- Scorecard
- Highest-risk issues
- Section-by-section fixes
- Voice cleanup notes
- Missing proof and E-E-A-T
- Product-promotion cuts or repositioning
- Comparison or listicle fairness fixes, if relevant
- Final publish checklist

When the user supplied text, give direct edits or replacement snippets. Keep
critique actionable and specific to this page.

## Handoffs

- Use the `page-strategy` skill when the premise, target query, or structure
  needs rethinking before editing.
- Use the `site-content-audit` skill when the issue spans many URLs or a whole
  section or template.
