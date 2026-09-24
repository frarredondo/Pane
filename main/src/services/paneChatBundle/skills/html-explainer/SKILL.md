---
name: html-explainer
description: The house standard for any skill that renders an HTML page for a person to read, covering design tokens, typography, components, diagrams, and quality gates so every generated page shares one calm, graphic-first look. Use when a skill's instructions say to render its output per the html-explainer standards, or when the user asks for an HTML explainer of anything and no more specific skill applies.
argument-hint: "[what to explain, when invoked directly]"
allowed-tools: Read, Grep, Glob, Bash, Write
---

# HTML explainer

## Task: $ARGUMENTS

A page for a person is pictures interrupted by words. The diagram carries the
argument and the prose annotates it, the way a whiteboard sketch carries a
design review. A section with no visual either earns its place in prose or
folds into depth.

This skill holds the one look and quality bar every generated page shares, so
pages stay consistent. Skills that produce pages (`teach-back`, `eli5`, and
future ones) follow it. Invoked directly, it renders a one-off explainer of
whatever the argument names.

## The file

One self-contained `.html` file, built only for reading. There is no hosting,
publish step, or capability layer to design for.

- Inline CSS in a single `<style>` block and inline SVG for every drawing.
- No external requests of any kind: no CDN, web fonts, or remote images.
- Scripts only when the page genuinely needs interaction, and then only
  vanilla inline JS.
- System font stacks only. Target well under 200KB.
- Write it to `./tmp/` (or the caller's stated destination), then open it in
  the browser (`open` on macOS, `xdg-open` on Linux) unless the caller says
  not to.

## Tokens

Copy this block verbatim as the start of the style sheet. Extend it only by
adding tokens; keep these as they are.

```css
:root {
  --paper: #FAF8F5; --ink: #1F2328; --ink-soft: #5A5F66;
  --line: #E4DFD7; --panel: #FFFFFF;
  --accent: #0E7569; --accent-soft: #E3F0EE;
  --warn: #B45309; --warn-soft: #F7EBDD;
  --bad: #9F3A38; --bad-soft: #F6E8E7;
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #15191D; --ink: #E8E6E1; --ink-soft: #9BA1A8;
    --line: #2C3237; --panel: #1C2126;
    --accent: #2FA79A; --accent-soft: #16302D;
    --warn: #D98E3D; --warn-soft: #32271A;
    --bad: #CF6F6C; --bad-soft: #33211F;
  }
}
```

## Drawings

Every page opens with one drawing directly after the masthead: the whiteboard
sketch the rest of the page elaborates. Add more wherever a relationship, a
flow, or a comparison is the point. Draw first, then write around the drawing.

- Inline SVG on the tokens: `--panel` fills, `--line` strokes, `--accent` for
  the path that matters, `--warn` and `--bad` where verdicts are part of the
  picture, `--sans` labels at 12 to 14px.
- Sketch energy over precision: slightly rounded corners, imperfect widths,
  dashed strokes for the tentative and solid for the certain, arrows with real
  heads. Three boxes and an arrow beat a mural.
- Warmth comes from the drawing alone: no gradients, shadows, icon fonts, or
  clip art.
- Legible at page width, `viewBox` set, no fixed pixel widths. A simple
  subject gets a simple drawing, and every page gets one.
- When the user wants a diagram they can edit themselves, use the
  `excalidraw-pr-diagrams` skill.

## Type and layout

- Body: `--sans`, 16px, line-height 1.6, `--ink` on `--paper`, one centered
  column, `max-width: 72ch`, generous vertical rhythm.
- `h1`: `--serif`, weight 500, ~2.1rem, `text-wrap: balance`. One per page.
  Directly under it, a one-sentence standfirst in `--ink-soft`.
- Section headers: a mono uppercase eyebrow (`.72rem`, letter-spacing `.1em`,
  `--accent`) above an `h2` (~1.25rem). Number sections when order matters.
- Code: `--mono` on `--panel` with a `--line` border.
- Prose lines stay under 90 characters. Only a `pre` with its own overflow
  scrolls horizontally.

## Components

This is the whole vocabulary. A page uses what it needs and invents nothing:

- `.badge`: mono, uppercase, `.72rem`, soft background. Accent for identity
  and success, warn for caution, bad for failure. Badges carry verdicts; prose
  carries reasons.
- `.panel`: `--panel` background, `--line` border, 6px radius, padded. The
  unit of grouped content. Use grids of panels for comparisons (before/after,
  expected/actual).
- `.callout`: a panel with a 3px left border in accent, warn, or bad.
  One-paragraph emphasis, used sparingly.
- `.card`: a panel with a mono eyebrow title, for repeating items (a lesson,
  a promise, a dependency).
- `details > summary`: for depth the reader opts into. The page must read
  complete with every `details` closed.

## The bar

Before opening the page, check all of these and fix any failure before
shipping:

1. The drawings could carry the page alone: a reader who skims only them and
   the headers leaves oriented.
2. It renders complete with JavaScript disabled and every `details` closed.
3. Nothing is fetched: no `src`, `href`, or `url()` loads an external
   resource (stylesheet, script, font, image). URLs quoted as text or code are
   fine; a page about an endpoint must be able to print it.
4. It reads well in both light and dark color schemes.
5. Every fact on the page came from the caller's material. The page adds
   structure and pictures, never claims.
6. One `h1`, sections in reading order, and only the component vocabulary
   above.

## Boundaries

- This skill owns form. The invoking skill owns content, truth, where the
  file lives, and what the chat reply says. Its reply and open-in-browser
  rules override the defaults here.
- When a caller needs more than the vocabulary, extend the vocabulary here in
  a PR. Keep the style in this one file.
- No em dashes, on the page or in this file.
