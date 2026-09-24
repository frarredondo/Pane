---
name: eli5
description: Teach an unfamiliar topic from first principles with a picture-first HTML explanation, saved in Grain when connected. Use for "explain from scratch," "I'm lost," "what does this mean?", "explain in plain English," beginner questions about how something works, or /eli5; no explicit skill invocation is needed. Skip simple factual lookups and respect text-only requests.
argument-hint: "<topic, question, or path to explain>"
model: claude-opus-4-6
allowed-tools: Read, Grep, Glob, Bash, Write
---

# ELI5

## Task: $ARGUMENTS

The reader is sharp, busy, and new to exactly this topic. Give them only
jargon you have explained, and no padding. One page, one topic, picture first.

## When to use it

- Use ELI5 when the person needs the foundations of a topic. Keep the three
  floors below.
- For a visual companion to an existing discussion or review, use
  [explain-visually](../explain-visually/SKILL.md) and leave the task as it is.
- Follow that skill's HTML, saving, and verification guidance for this page
  too. ELI5 owns the teaching structure and the reply format. Produce one
  artifact.

## The writer (Claude)

Opus 4.6 writes the page because it writes better. The frontmatter pins it
for direct invocation. When an orchestrator or a session on another model runs
this skill, it hands the writing to an Opus 4.6 session
(`claude -p --model claude-opus-4-6` with this skill and the grounding facts).
The cheapest agent can do the grounding. Opus 4.6 does the prose and drawings.

## Ground it

Before writing, find the truth of the topic in what is actually here:

- For a topic inside this repo, read the real code and trace the real flow.
- For a general topic, work from what you know and say so.
- Collect the three to five facts the whole explanation hangs on.
- If the honest answer to "how does this work" is "it doesn't", the page says
  so. An explainer that flatters a broken thing teaches the wrong lesson.

## The three floors

The page renders per the [html-explainer](../html-explainer/SKILL.md) skill
(tokens, components, diagram rules, quality bar), as three floors the reader
descends by choice:

1. **The picture.** Masthead, then the opening diagram, then at most a
   hundred words: the one metaphor or plain-language mechanism that makes the
   topic click. A reader who stops here leaves with the right intuition and
   no vocabulary.
2. **The mechanism.** How it actually works, still in plain words, with one
   or two more diagrams or panel pairs (before/after, request/response,
   cause/effect). Introduce each new term at the moment it pays for itself. A
   reader who stops here could explain it to someone else.
3. **The real names.** Inside `details` blocks: the proper terms mapped to the
   plain words above, file:line anchors when the topic is code, the two or
   three things people commonly get wrong, and where to go deeper. A reader
   who opens these is ready for the real documentation.

## Metaphors

- Carry one metaphor all the way through. It beats three abandoned ones.
- Pick it for mechanical honesty: its parts must correspond to the real parts.
  Drop it the moment it would mislead.
- Some topics are best explained literally. A plain diagram of the actual
  parts always works.
- For an abstract topic with no visual shape, diagram the relationship: what
  talks to what, what depends on what.

## Words

- Floor 1 under a hundred words; the whole page under six hundred. The budget
  counts every word the reader sees with `details` closed, including captions,
  masthead, and SVG labels. Markup and style count nothing.
- Short declarative sentences. No "simply", "just", or "magic".
- Numbers over adjectives: "answers in about 7 seconds" beats "fast".
- Keep a sentence only if the reader needs it to understand the next one.

## Boundaries

- Save the page in the task's existing Grain workspace when connected,
  following [explain-visually](../explain-visually/SKILL.md). Pass the
  workspace ID and storage rule to any writer. Keep needed local files,
  respect audience and privacy limits, and save locally when Grain is
  disconnected. This overrides the renderer's local-only, no-publication
  defaults and keeps its visual standards.
- Accuracy outranks simplicity. Simplify by omission, never by distortion,
  and name the biggest thing you left out in floor 3.
- The page is the deliverable. The chat reply is one line saying where it is
  and what it covers.
- No em dashes.
