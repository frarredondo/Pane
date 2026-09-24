---
name: explain-visually
description: Complement an answer or discussion with a first-principles visual HTML explanation, saved in Grain when connected. Use when explaining how something works, why it changes, or how options differ and a visual would materially help understanding, including requests like "show me" or "help me understand." Skip simple factual answers and text-only requests.
---

# Explain visually

You help a capable, busy person understand an unfamiliar idea. Make the
underlying problem, mechanism, and outcome clear before any implementation
detail.

## Complement the conversation

- When a visual would help the question, create the companion without waiting
  for a separate invocation. Skip the artifact when a short answer already
  makes the point.
- Work from the current question and the available evidence. Read sources as
  needed, and separate facts, proposed behavior, and uncertainty.
- Support the active task (discussion, research, review, or other). Leave its
  approvals, completion criteria, and implementation to that task.
- If another skill is already producing a suitable page, add to that artifact.
  This skill also works on its own.
- `eli5` owns beginner-first teaching. When it runs, provide its visual
  companion and keep its teaching structure and reply format.

## Explain the idea

Choose the explanation and visuals that make the idea easiest to understand.
Build from first principles, keep useful detail, and let the subject set the
format. Some examples:

- Retries: what happens when an attempt fails, how it recovers, and what the
  person sees.
- Permissions: who can see or change something, and why that boundary exists.
- Tradeoffs: what each option makes easier, what it costs, and when the choice
  matters.

Place each visual beside the explanation it supports. Introduce technical terms
when they earn their place, and show code structure only when it answers a
remaining question. Metaphors must match the real mechanism, and important
caveats stay visible.

## Create the HTML

- Make a focused, self-contained HTML companion with inline CSS and SVG, real
  labels, and source links where they support claims. Show only measurements
  and evidence you have.
- Reuse a suitable existing visual style, or `html-explainer` when available.
  Otherwise use calm typography, generous spacing, clear headings, and layouts
  that read well in light and dark themes and on narrow screens.
- Add navigation or expandable detail when the depth warrants it. The main
  explanation must make sense with every detail closed and without JavaScript.
  Skip app frameworks and dependencies the page doesn't need.
- Keep the user's requested style and destination. The subject sets the
  layout; no set of diagrams, panels, or sections is mandatory.

## Save, verify, and return

- When Grain is connected, read its installed skill and reuse the task's
  workspace or a matching explanation workspace. Otherwise create a clearly
  named workspace in the requested folder, `Development Artifacts` by default.
  Keep its ID for follow-up updates, and keep local working files when needed.
- Without Grain, save a local HTML file in the requested location or the
  task's `tmp/` folder and carry on. If a connected save fails, keep the local
  artifact and report it as unsynced.
- Keep secrets and private source material out of uploads. Create public
  shares or change audience permissions only with authorization. Honor
  local-only requests.
- Check the explanation against its sources. Inspect the saved page with the
  available browser tools for clipping, readable labels, light and dark and
  mobile layout, navigation, and links, and fix what you find. If you can't
  inspect it visually, report that limit; never claim it passed.
- Answer the question briefly in chat and link the verified companion. The
  chat answer must stand on its own. Open the page when the workflow supports
  and welcomes it, without taking focus from ongoing work.
