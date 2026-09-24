---
name: excalidraw-pr-diagrams
description: Create Excalidraw diagram JSON files and PR visual overviews that make visual arguments. Use when the user wants to visualize workflows, architectures, concepts, pull request changes, before/after behavior, or a shareable explainer image for reviewers.
---

# Excalidraw diagram creator

Generate `.excalidraw` JSON files that **argue visually**: the structure itself
shows relationships, causality, and flow.

To set up the renderer, follow [First-time setup](#first-time-setup).

## PR diagram workflow

- Create and edit diagram working files in a temporary directory outside the
  target repo, preferably `/tmp/codex-pr-diagrams/<repo-or-pr>/` or
  `C:\tmp\codex-pr-diagrams\<repo-or-pr>\`. Keep the matching `.excalidraw`
  sources there for iteration and reuse.
- Keep generated `.excalidraw`, `.png`, and temporary render files out of the
  repository unless the user asks for tracked diagram assets.
- In PR descriptions, the rendered Excalidraw image is the primary visual. Add
  a Mermaid diagram only when the user asks for a text-rendered fallback.
- Every PR visual overview has explicit `Before` and `After` diagrams, so
  reviewers see the old and new behavior without inferring the diff from
  prose.
- Keep each PR diagram on the change boundary: before, after, and why the new
  flow is safer.
- After generating diagrams, add a dedicated `## Visual Overview` section to
  the PR description.

### PR asset publishing

PR images are **hosted, not committed**, by default. Use a repository-owned
durable asset surface. For GitHub PRs, find and reuse a published, mutable,
long-lived release such as `pr-assets`; inspect it with `gh release list` and
`gh release view <tag> --json tagName,isDraft,isPrerelease,isImmutable,url,assets`.
One release serves every PR, and a suitable repository release always takes
precedence over an arbitrary temporary host.

If no suitable release exists, creating one long-lived `pr-assets` release is
a separate hard stop. It needs an exact grant such as
`{"action":"create_release","repo":"owner/name","tag":"pr-assets"}`; general
GitHub, PR, comment, or upload authorization does not cover it. Target the
default branch, use `--latest=false`, and say in its notes that it stores
long-lived PR and QA images.

If creation or upload is not authorized, keep the render local, prepare the
exact release creation and upload commands, the manifest, and the marked PR
Markdown, and report durable publication as blocked. Skip temporary hosts in
this case too.

Upload:

- Before upload, compute the PNG's SHA-256 and use a portable name such as
  `pr-<number>-<head-short-sha>-<content-sha12>-visual-overview.png`. Use a
  branch slug before a PR number exists.
- Inspect existing assets first so publishing is idempotent. Reuse an exact
  name only when its GitHub digest (or, with no digest, a downloaded hash)
  matches. For different content, extend the digest or add a deterministic
  suffix and upload under a new name.
- Never use `--clobber`: replacing an asset can silently change images
  embedded in older PRs.

Verify:

- After `gh release upload`, read back the release and asset metadata. Check
  the tag, a non-draft release, uploaded state, filename, size, digest when
  present, and browser download URL.
- GET the bytes directly (authenticated for a private repository), compare
  SHA-256 and size with the local render, and check the decoded file type or
  image magic, so an HTML error page fails.
- Keep a local `pr-assets-manifest.json` with the repository, release tag and
  URL, PR number, head commit, source and render paths, asset name, SHA-256,
  size, asset API and browser URLs, upload-or-reuse status, timestamp, and
  verification result. Keep credentials and sensitive source material out of
  it.

Commit the image only when tracked docs (a README, a design doc) embed it and
need a stable in-repo path. Put it in `.github/pr-assets/` or `docs/` and
reference it with a blob URL plus `?raw=1`, for example
`https://github.com/<owner>/<repo>/blob/<branch>/.github/pr-assets/<image>.png?raw=1`.
Keep `.excalidraw` sources outside the repo unless the user asks to track
them.

Either way:

- After updating, open or fetch the image URL. A PR visual with a 404 image is
  a failed handoff.
- Embed the verified image inline in a `## Visual Overview` section of the PR
  body or comment, bounded by `<!-- pr-visual-overview:start -->` and
  `<!-- pr-visual-overview:end -->`. On rerun, replace dead, expiring,
  temporary, or local-only references. Update only the marked section and
  preserve author text. For a broken image outside a marker, replace only the
  URL, after verifying the intended asset.
- Read back or preview the PR body or comment after updating it. Markdown that
  collapses bullets, headings, or the image into one paragraph is a failed
  handoff.

### PR diagram standard

A PR diagram must teach the change in a way prose can't. Before drawing, find
the visual truth of the PR:

- **Boundary changed**: draw walls, membranes, trust zones, or origin or
  process boundaries.
- **Lifecycle changed**: draw a state machine, gate sequence, or retry loop.
- **Responsibility moved**: draw before and after ownership regions and move
  the action across them.
- **Failure mode removed**: draw the old failure path dead-ending and the new
  path avoiding it.
- **Concurrency or race fixed**: draw clocks, timelines, joins, or retry
  circuits.
- **Validation or permissions changed**: draw a decision path, a lock or gate,
  and what passes through it.

Every PR visual overview includes:

- a **before path** showing where the old system failed or was fragile
- an **after path** showing the new route or control point
- at least one **semantic visual structure**: boundary, timeline, loop,
  funnel, state machine, swimlane, queue, fan-out, convergence, or layered
  stack
- one short **truth statement** that states the visual argument in plain
  language
- a small **term explainer** for protocol or framework words a reviewer may
  not know, such as header, preflight, origin, token, cookie, CORS, WebSocket
  upgrade, cache key, breakpoint, or trace

Give each PR in a series its own visual metaphor unless the code changes
truly share a shape. Split PRs usually fix different kinds of problems.

### Shareable explainers

When the user wants a PR image that teaches the change to someone else:

- Make the title state the strategic outcome.
- Show the old blind spot, failure mode, or uncertainty on the left.
- Show the new loop, boundary, path, or control point on the right.
- Include at least one concrete example input and one concrete output. Real
  event names, endpoint paths, page names, source URLs, or dashboard fields
  make the image authoritative.
- If measurement is part of the value, show what gets captured and how it
  becomes a decision, backlog item, or next action.
- Give each box room to breathe. Route loop-back arrows around the outside of
  the boxes.
- Inspect the final image at the size GitHub shows in a PR. If the viewer has
  to open it full size to understand it, simplify.

### Reviewer explainers

When a PR involves technical protocol behavior, add a compact teaching layer:

- Define the technical noun with a concrete metaphor before using it. For
  example: `headers = extra notes the browser wants to attach`,
  `preflight = permission check before the real request`,
  `origin = website address the browser trusts or blocks`.
- Show who performs each action: `Browser asks`, `API answers`,
  `Browser blocks`.
- Use concrete examples sparingly: `login badge`, `Sentry trace`, and
  `Firebase app id` read better than a long raw header list.
- Keep the official term in parentheses after the plain one when useful:
  `permission check (CORS preflight)`.
- Map any metaphor to the real system with labels. A security desk can teach
  CORS, but the browser and API roles stay visible.

Assume the reader is smart but new to this subsystem. Wherever they would ask
"who does that?" or "what is that?", add a visual cue or a one-line
explainer.

## Customization

All colors and brand-specific styles live in
[references/color-palette.md](references/color-palette.md). Read it before
generating any diagram and take every color from it: shape fills, strokes,
text colors, evidence artifact backgrounds. To change the brand style, edit
that file; the rest of this skill is general design method and Excalidraw
practice.

---

## Core philosophy

**Diagrams argue.** A diagram is a visual argument that shows relationships,
causality, and flow that words alone can't. The shape should be the meaning.

- **Isomorphism test**: with all text removed, would the structure alone
  communicate the concept? If not, redesign.
- **Education test**: could someone learn something concrete from it? A good
  diagram teaches: actual formats, real event names, concrete examples.
- **Redundancy test**: if the diagram is the PR description split into red and
  green rectangles, discard it. A good diagram uses spatial relationships,
  arrows, boundaries, and shape to reveal something the prose doesn't.
- **High-schooler test**: a smart high-schooler should be able to point at the
  diagram and explain the core before and after change without reading the
  PR. If they would only read labels aloud, redesign.

---

## Depth assessment (do this first)

Decide how much detail the diagram needs.

### Simple or conceptual

Use abstract shapes when:

- explaining a mental model or philosophy
- the audience needs no technical specifics
- the concept is the abstraction (for example, "separation of concerns")

### Comprehensive or technical

Use concrete examples when:

- diagramming a real system, protocol, or architecture
- the diagram will teach or explain (for example, in a YouTube video)
- the audience needs to see what things actually look like
- showing how several technologies integrate

**Technical diagrams must include evidence artifacts** (see below).

---

## Research first (technical diagrams)

**Before drawing anything technical, research the actual specifications.** For
a protocol, API, or framework:

1. Look up the actual JSON and data formats.
2. Find the real event names, method names, or API endpoints.
3. Understand how the pieces connect.
4. Use real terminology in place of generic placeholders.

Bad: "Protocol" → "Frontend"
Good: "AG-UI streams events (RUN_STARTED, STATE_DELTA, A2UI_UPDATE)" → "CopilotKit renders via createA2UIMessageRenderer()"

Research makes diagrams accurate and educational.

---

## Evidence artifacts

Evidence artifacts are concrete examples that prove the diagram is accurate
and help viewers learn. Include them in technical diagrams. Choose the types
that fit:

| Artifact Type | When to Use | How to Render |
|---------------|-------------|---------------|
| **Code snippets** | APIs, integrations, implementation details | Dark rectangle + syntax-colored text (see color palette for evidence artifact colors) |
| **Data/JSON examples** | Data formats, schemas, payloads | Dark rectangle + colored text (see color palette) |
| **Event/step sequences** | Protocols, workflows, lifecycles | Timeline pattern (line + dots + labels) |
| **UI mockups** | Showing actual output/results | Nested rectangles mimicking real UI |
| **Real input content** | Showing what goes IN to a system | Rectangle with sample content visible |
| **API/method names** | Real function calls, endpoints | Use actual names from docs, not placeholders |

Examples:

- A streaming protocol: the actual event names from the spec, a code snippet
  showing how to connect, and what the streamed data looks like.
- A data transformation pipeline: sample input and output in their actual
  formats, plus intermediate states if relevant.

The principle: **show what things actually look like.**

---

## Multi-zoom architecture

A comprehensive diagram works at several zoom levels at once, like a map with
both country borders and street names.

1. **Summary flow.** A simplified overview of the whole pipeline or process,
   often at the top or bottom. Example: `Input → Processing → Output` or
   `Client → Server → Database`.
2. **Section boundaries.** Labeled regions that group related components into
   visual "rooms". Example: by responsibility (Backend / Frontend), by phase
   (Setup / Execution / Cleanup), or by team (User / System / External).
3. **Detail inside sections.** Evidence artifacts, code snippets, and concrete
   examples, where the teaching happens. Example: inside a "Backend" section,
   the actual API response format.

Aim for all three levels in comprehensive diagrams: the summary gives context,
the sections organize, and the details teach.

### Bad vs good

| Bad (Displaying) | Good (Arguing) |
|------------------|----------------|
| 5 equal boxes with labels | Each concept has a shape that mirrors its behavior |
| Card grid layout | Visual structure matches conceptual structure |
| Icons decorating text | Shapes that ARE the meaning |
| Same container for everything | Distinct visual vocabulary per concept |
| Everything in a box | Free-floating text with selective containers |
| Red card titled "Before" beside green card titled "After" | A before failure path and an after success path with different routing |
| Repeating the same template across unrelated PRs | Choosing a visual metaphor per PR: boundary, lifecycle, race, permission gate, retry loop |
| Paragraphs pasted into shapes | Short labels plus visual evidence, arrows, gates, and concrete artifacts |

### Hard anti-patterns

Leave these out unless the user explicitly asks for a deliberately minimal
sketch:

- two large cards that summarize "Before" and "After"
- a diagram whose boxes could become bullets with no loss of meaning
- red and green color as the only source of meaning
- several PR diagrams with the same layout when the PRs solve different
  problems
- oversized headings that make the rest of the diagram sprawl
- long prose inside Excalidraw text boxes
- rendered output with any text, title, arrow, or shape clipped
- rendered output that needs horizontal scrolling to understand

### Simple vs comprehensive

| Simple Diagram | Comprehensive Diagram |
|----------------|----------------------|
| Generic labels: "Input" → "Process" → "Output" | Specific: shows what the input/output actually looks like |
| Named boxes: "API", "Database", "Client" | Named boxes + examples of actual requests/responses |
| "Events" or "Messages" label | Timeline with real event/message names from the spec |
| "UI" or "Dashboard" rectangle | Mockup showing actual UI elements and content |
| ~30 seconds to explain | ~2-3 minutes of teaching content |
| Viewer learns the structure | Viewer learns the structure AND the details |

Simple diagrams suit abstract concepts, quick overviews, and audiences who
already know the details. Comprehensive diagrams suit technical
architectures, tutorials, and educational content, where the diagram itself
should teach.

---

## Containers and free-floating text

Default to free-floating text. Add a container only when it serves a purpose.

| Use a Container When... | Use Free-Floating Text When... |
|------------------------|-------------------------------|
| It's the focal point of a section | It's a label or description |
| It needs visual grouping with other elements | It's supporting detail or metadata |
| Arrows need to connect to it | It describes something nearby |
| The shape itself carries meaning (decision diamond, etc.) | Typography alone creates sufficient hierarchy |
| It represents a distinct "thing" in the system | It's a section title, subtitle, or annotation |

- **Typography as hierarchy**: font size, weight, and color create hierarchy
  without boxes. A 28px title needs no rectangle.
- **Container test**: for each boxed element, ask whether it would work as
  free-floating text. If yes, remove the container.

## Canvas, text, and fit

Excalidraw text wraps differently from HTML. Design for the renderer and its
actual output.

### Canvas

- Start larger than you think you need. For PR diagrams, plan around
  **1600-2200 px wide** and **900-1400 px tall** before export.
- Spend the space on spatial structure. Titles and paragraphs stay small.
- Prefer two or three clear regions over many cramped micro-panels.
- Leave at least **80 px** of outer margin and **50 px** between major
  regions.

### Text

- Keep titles short, ideally under 55 characters.
- Use smaller titles than instinct suggests: **24-30 px** is usually enough.
- Use **14-18 px** for labels and **16-20 px** for truth statements.
- Keep shape labels to **1-4 short lines**. For more, split into nearby
  annotations or let the diagram carry more of the meaning.
- Insert line breaks by hand.
- Make text boxes at least **30-50% wider** than the text seems to need.
- Set `width` and `height` generously on every text element. Clipping is a
  hard failure.

### Render fit

Inspect the exact PNG that the PR will show:

- If anything is clipped, add canvas space or shrink and reposition text.
- If the diagram is mostly text, remove prose and add visual structure.
- If the title dominates, shrink it.
- If labels overlap arrows or shapes, move them out of the flow path.
- If the image is too wide to read in GitHub, cut prose and stack regions
  vertically.

---

## Design process (before generating JSON)

### Step 0: assess depth

Decide whether the diagram is:

- **Simple or conceptual**: abstract shapes, labels, relationships (mental
  models, philosophies)
- **Comprehensive or technical**: concrete examples, code snippets, real data
  (systems, architectures, tutorials)

For a comprehensive diagram, research first: actual specs, formats, event
names, APIs.

### Step 1: understand deeply

Read the content. For each concept, ask:

- What does this concept **do**?
- What relationships exist between concepts?
- What is the core transformation or flow?
- **What would someone need to see to understand this?**

### Step 2: map concepts to patterns

For each concept, find the visual pattern that mirrors its behavior:

| If the concept... | Use this pattern |
|-------------------|------------------|
| Spawns multiple outputs | **Fan-out** (radial arrows from center) |
| Combines inputs into one | **Convergence** (funnel, arrows merging) |
| Has hierarchy/nesting | **Tree** (lines + free-floating text) |
| Is a sequence of steps | **Timeline** (line + dots + free-floating labels) |
| Loops or improves continuously | **Spiral/Cycle** (arrow returning to start) |
| Is an abstract state or context | **Cloud** (overlapping ellipses) |
| Transforms input to output | **Assembly line** (before → process → after) |
| Compares two things | **Side-by-side** (parallel with contrast) |
| Separates into phases | **Gap/Break** (visual separation between sections) |

### Step 3: ensure variety

In multi-concept diagrams, give **each major concept a different visual
pattern**. Avoid uniform cards and grids.

### Step 4: sketch the flow

Before writing JSON, trace how the eye moves through the diagram. It should
tell a clear visual story.

### Step 5: generate JSON

Now create the Excalidraw elements. For large diagrams, see
[Building large diagrams](#building-large-diagrams).

### Step 6: render and validate (required)

After generating the JSON, run the render-view-fix loop in
[Render and validate](#render-and-validate-required) until the diagram looks
right.

---

## Building large diagrams

**Build comprehensive or technical diagrams one section at a time.** This is a
hard constraint. Output limits per response (about 32,000 tokens in Claude
Code) are easy to exceed with a full diagram, which yields truncated, broken
JSON. Even when it would fit, section-by-section gives better results.

Write the JSON by hand in your own session:

- A delegated coding agent lacks this skill's rules, and the coordination
  costs more than it saves.
- A Python generator script adds a layer of indirection that makes debugging
  harder. Hand-written JSON with descriptive IDs is easier to maintain.

### Phase 1: build each section

1. **Create the base file** with the JSON wrapper (`type`, `version`,
   `appState`, `files`) and the first section's elements.
2. **Add one section per edit.** Give each section its own careful pass:
   layout, spacing, and how it connects to what's already there.
3. **Use descriptive string IDs** (for example `"trigger_rect"`,
   `"arrow_fan_left"`) so cross-section references are readable.
4. **Namespace seeds by section** (section 1 uses 100xxx, section 2 uses
   200xxx) to avoid collisions.
5. **Update cross-section bindings as you go.** When a new element binds to
   one from an earlier section (an arrow between sections, say), edit the
   earlier element's `boundElements` array at the same time.

### Phase 2: review the whole

With all sections in place, read the complete JSON and check:

- Are cross-section arrows bound correctly at both ends?
- Is spacing balanced, or are some sections cramped and others sparse?
- Do all IDs and bindings reference elements that exist?

Fix alignment and binding issues before rendering.

### Phase 3: render and validate

Run the render-view-fix loop. It catches what JSON hides: overlaps, clipping,
and unbalanced composition.

### Section boundaries

Plan sections around the natural visual groupings in your design. A typical
large diagram splits into:

- **Section 1**: entry point or trigger
- **Section 2**: first decision or routing
- **Section 3**: main content (the hero section, often the largest)
- **Sections 4-N**: remaining phases, outputs, and so on

Each section should stand on its own: its elements, internal arrows, and any
cross-references to adjacent sections.

---

## Visual pattern library

### Fan-out (one-to-many)

A central element with arrows radiating to several targets. Use for sources,
PRDs, root causes, central hubs.

```
        ○
       ↗
  □ → ○
       ↘
        ○
```

### Convergence (many-to-one)

Several inputs merging through arrows into one output. Use for aggregation,
funnels, synthesis.

```
  ○ ↘
  ○ → □
  ○ ↗
```

### Tree (hierarchy)

Parent-child branching with connecting lines and free-floating text. Use for
file systems, org charts, taxonomies.

```
  label
  ├── label
  │   ├── label
  │   └── label
  └── label
```

Use `line` elements for the trunk and branches, and free-floating text for
labels.

### Spiral or cycle (continuous loop)

Elements in sequence with an arrow back to the start. Use for feedback loops,
iterative processes, evolution.

```
  □ → □
  ↑     ↓
  □ ← □
```

### Cloud (abstract state)

Overlapping ellipses of varied sizes. Use for context, memory, conversations,
mental states.

### Assembly line (transformation)

Input → process box → output, with a clear before and after. Use for
transformations, processing, conversion.

```
  ○○○ → [PROCESS] → □□□
  chaos              order
```

### Side-by-side (comparison)

Two parallel structures with visual contrast. Use for before and after,
options, trade-offs.

### Gap or break (separation)

Whitespace or a barrier between sections. Use for phase changes, context
resets, boundaries.

### Lines as structure

Use lines (type `line`, without arrowheads) as primary structure in place of
boxes:

- **Timelines**: a vertical or horizontal line with small dots (10-20px
  ellipses) at intervals and free-floating labels beside each dot
- **Trees**: a vertical trunk line and horizontal branch lines with
  free-floating labels
- **Dividers**: thin dashed lines between sections
- **Flow spines**: a central line that elements relate to

```
Timeline:           Tree:
  ●─── Label 1        │
  │                   ├── item
  ●─── Label 2        │   ├── sub
  │                   │   └── sub
  ●─── Label 3        └── item
```

Lines with free-floating text often look cleaner than boxes with contained
text.

---

## Shape meaning

Choose a shape for what it represents, or use none:

| Concept Type | Shape | Why |
|--------------|-------|-----|
| Labels, descriptions, details | **none** (free-floating text) | Typography creates hierarchy |
| Section titles, annotations | **none** (free-floating text) | Font size/weight is enough |
| Markers on a timeline | small `ellipse` (10-20px) | Visual anchor, not container |
| Start, trigger, input | `ellipse` | Soft, origin-like |
| End, output, result | `ellipse` | Completion, destination |
| Decision, condition | `diamond` | Classic decision symbol |
| Process, action, step | `rectangle` | Contained action |
| Abstract state, context | overlapping `ellipse` | Fuzzy, cloud-like |
| Hierarchy node | lines + text (no boxes) | Structure through lines |

**Rule**: default to no container, and add shapes only when they carry
meaning. Aim for under 30% of text elements inside containers.

---

## Color as meaning

Colors encode information. Take every color from
[references/color-palette.md](references/color-palette.md), which defines the
semantic shape colors, text hierarchy colors, and evidence artifact colors.

- Each semantic purpose (start, end, decision, AI, error, and so on) has its
  own fill and stroke pair.
- Free-floating text uses color for hierarchy: titles, subtitles, and details
  each at their own level.
- Evidence artifacts (code snippets, JSON examples) use their own dark
  background and colored text.
- Pair a darker stroke with a lighter fill for contrast.
- Use only palette colors. If a concept fits no semantic category, use
  Primary/Neutral or Secondary.

---

## Modern aesthetics

### Roughness

- `roughness: 0`: clean, crisp edges for modern or technical diagrams. The
  default for most professional work.
- `roughness: 1`: hand-drawn, organic feel for brainstorming or informal
  diagrams.

### Stroke width

- `strokeWidth: 1`: thin and elegant, for lines, dividers, subtle connections
- `strokeWidth: 2`: standard, for shapes and primary arrows
- `strokeWidth: 3`: bold, used sparingly for emphasis (the main flow line, key
  connections)

### Opacity

Use `opacity: 100` on every element. Build hierarchy with color, size, and
stroke width.

### Small markers

Use small dots (10-20px ellipses) in place of full shapes as timeline markers,
bullet points, connection nodes, and anchors for free-floating text.

---

## Layout principles

- **Hierarchy through scale**:
  - Hero: 300×150, the visual anchor and most important element
  - Primary: 180×90
  - Secondary: 120×60
  - Small: 60×40
- **Whitespace is importance**: the most important element has the most empty
  space around it (200px+).
- **Flow direction**: guide the eye left to right or top to bottom for
  sequences, and radially for hub-and-spoke.
- **Connections**: if A relates to B, draw an arrow between them. Position
  alone shows no relationship.

---

## Text rules

The JSON `text` property contains **only readable words**.

```json
{
  "id": "myElement1",
  "text": "Start",
  "originalText": "Start"
}
```

Settings: `fontSize: 16`, `fontFamily: 3`, `textAlign: "center"`, `verticalAlign: "middle"`

---

## JSON structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

## Element templates

[references/element-templates.md](references/element-templates.md) has
copy-paste JSON templates for each element type (text, line, dot, rectangle,
arrow). [references/json-schema.md](references/json-schema.md) lists the
properties. Pull colors from the palette by each element's semantic purpose.

---

## Render and validate (required)

Judge the diagram from the rendered image. After generating or editing the
JSON, render it to PNG, view the image, and fix what you see, in a loop until
it's right. This loop is part of the work, and it runs every time.

### How to render

```bash
cd .claude/skills/excalidraw-pr-diagrams/references && uv run python render_excalidraw.py <path-to-file.excalidraw>
```

Codex: use the matching `.codex/skills/excalidraw-pr-diagrams/references`
directory.

The script writes a PNG next to the `.excalidraw` file. Inspect the PNG with
the image viewer you have: the Read tool, `view_image`, or a browser
screenshot.

### The loop

1. **Render and view.** Run the render script, then view the PNG.
2. **Audit against your design.** Before hunting bugs, compare the result with
   what you planned in steps 1-4:
   - Does the visual structure match the conceptual structure?
   - Does each section use the intended pattern (fan-out, convergence,
     timeline, and so on)?
   - Does the eye move through the diagram in the order you designed?
   - Is the hierarchy right, with hero elements dominant and supporting
     elements smaller?
   - Technical diagrams: are the evidence artifacts readable and well placed?
   - PR diagrams: does the image tell a non-redundant before and after story
     through structure?
   - Would the image still carry the main change with the prose paragraphs
     removed?
3. **Check for visual defects:**
   - text clipped by or overflowing its container
   - text or shapes overlapping other elements
   - arrows crossing through elements
   - arrows landing on the wrong element or pointing into empty space
   - arrowheads, dashed loops, or feedback paths sitting on top of boxes or
     labels
   - labels floating ambiguously, unclear what they describe
   - uneven spacing between elements that should be evenly spaced
   - sparse sections next to cramped ones
   - text too small to read at the rendered size
   - a lopsided or unbalanced composition
   - any part of the title, subtitle, truth statement, or a major region
     clipped by the screenshot bounds
   - a horizontally sprawling image that is hard to scan in a GitHub PR
   - PR-specific: the published image URL 404s, the PR body image fails to
     render, or Markdown collapses into one paragraph
4. **Fix.** Edit the JSON to address everything you found. Common fixes:
   - widen containers when text is clipped
   - adjust `x` and `y` coordinates for spacing and alignment
   - add waypoints to arrow `points` arrays to route around elements
   - move labels closer to what they describe
   - resize elements to rebalance weight across sections
   - shrink titles and labels before enlarging the diagram
   - replace long labels with a diagram construct: boundary, queue, gate,
     loop, timeline, or swimlane
5. **Re-render and re-view.** Run the script again and view the new PNG.
6. **Repeat** until the diagram passes both the design audit (step 2) and the
   defect check (step 3), typically 2-4 iterations. If the composition could
   still be better after a clean pass, improve it.

### When to stop

The loop is done when:

- the render matches the design from your planning steps
- all text is unclipped, separate, and readable
- arrows route cleanly and connect to the right elements
- spacing is consistent and the composition balanced
- you'd show it to someone without caveats
- for PR diagrams, before and after differ visually in a way that reflects the
  actual code change
- the diagram does more than a plain bullet list could

### First-time setup

If the render script isn't set up yet:

```bash
cd .claude/skills/excalidraw-pr-diagrams/references
uv sync
uv run playwright install chromium
```

Codex: use `.codex/skills/excalidraw-pr-diagrams/references`.

---

## Quality checklist

### Depth and evidence (check first for technical diagrams)

1. **Research done**: you looked up actual specs, formats, and event names.
2. **Evidence artifacts**: code snippets, JSON examples, or real data appear.
3. **Multi-zoom**: summary flow, section boundaries, and detail.
4. **Concrete**: real content shown, beyond labeled boxes.
5. **Educational**: someone could learn something concrete from it.

### Conceptual

6. **Isomorphism**: each visual structure mirrors its concept's behavior.
7. **Argument**: the diagram shows something text alone couldn't.
8. **Variety**: each major concept uses a different visual pattern.
9. **Varied containers**: no card grids or rows of equal boxes.
10. **Non-redundant**: the image adds to the PR description.
11. **Before and after story**: the old failure path and new success path look
    different.
12. **Metaphor fit**: the metaphor matches the change type (boundary,
    lifecycle, race, permission, ownership, and so on).

### Container discipline

13. **Minimal containers**: every boxed element needs its box.
14. **Lines as structure**: tree and timeline patterns use lines and text.
15. **Typography hierarchy**: font size and color create the hierarchy.

### Structural

16. **Connections**: every relationship has an arrow or line.
17. **Flow**: a clear visual path for the eye.
18. **Hierarchy**: important elements are larger or more isolated.

### Technical

19. **Text clean**: `text` contains only readable words.
20. **Font**: `fontFamily: 3`.
21. **Roughness**: `roughness: 0` for clean and modern, unless a hand-drawn
    style was requested.
22. **Opacity**: `opacity: 100` on every element.
23. **Container ratio**: under 30% of text elements inside containers.

### Visual validation (render required)

24. **Rendered to PNG**: the diagram was rendered and inspected.
25. **No text overflow**: all text fits its container.
26. **No clipping**: the screenshot bounds include every title, label, arrow,
    and shape.
27. **No unintended overlaps** between shapes and text.
28. **Even spacing**: similar elements are spaced consistently.
29. **Arrows land correctly**: arrows reach their targets without crossing
    other elements.
30. **Readable at export size**: text is legible in the PNG.
31. **Balanced composition**: no large voids or overcrowded regions.
32. **GitHub readable**: the image makes sense embedded in a PR, without
    opening it full size.
