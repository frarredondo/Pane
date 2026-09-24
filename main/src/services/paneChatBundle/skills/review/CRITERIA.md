# Code review criteria

Shared criteria for the `review` skill and the `implementation-reviewer` skill.
This file is project-agnostic. A repo may append a per-repo section with its
own rules; the discovery step below explains how to find and apply them.

---

## 0. Discovery (required first step)

Derive the project's actual floor from the repo before applying anything below.
Read these sources in priority order; they override the generic criteria:

1. **AGENTS.md** (or CLAUDE.md): project conventions, forbidden patterns,
   tooling.
2. **Lint configuration and blocking custom rules**: the CI-enforced floor for
   new code.
3. **Compiler and build configuration, when present**: for example tsconfig,
   pyproject.toml, Cargo.toml.
4. **Manifests and CI**: the frameworks, toolchains, and checks in use.

Where the repo's rules conflict with a generic criterion, the repo wins. State
the override in the review.

Apply stack- and product-specific examples only where they fit. React,
TypeScript, UI panels, and JavaScript conventions apply only to projects that
use them.

---

## 1. Bugs and correctness (must-fix)

- Logic errors: incorrect conditionals, off-by-one, wrong comparison operators
- Null and undefined risks: missing optional chaining, unhandled nullable paths
- Async bugs: missing `await`, unhandled promise rejections, race conditions
- Error handling: missing `try/catch` on calls that can throw, unhandled error
  states
- State bugs: stale closures in hooks, missing dependency array entries

## 2. Security (must-fix)

- `dangerouslySetInnerHTML` without DOMPurify sanitization
- API keys, tokens, or credentials in frontend code
- User input rendered without sanitization
- Command injection or XSS vectors
- Missing auth or permission checks on new endpoints or IPC channels

## 3. React and component design (should-fix)

- Components under 200-300 lines; JSX under about 50 lines per component
- Single responsibility: business logic separate from presentational rendering
- Props destructured at the function signature and explicitly typed
- Context or state management in place of prop drilling through 3+ levels
- Hooks called only at the top level, outside loops, conditionals, and nested
  functions
- Complete `useEffect` dependency arrays, with cleanup for subscriptions and
  timers
- `useCallback` on functions passed as props to child components
- `useMemo` only on genuinely expensive computations
- `useState` only for values that can't be derived from props or other state
- Error Boundaries at critical subtree boundaries
- Loading, error, and empty states all handled explicitly
- Stable unique keys for list rendering; array index only for static lists
- `React.lazy` + `Suspense` for code-split routes and heavy components

## 4. TypeScript (should-fix)

- Specific types, or `unknown` with narrowing, in place of explicit `any`
- `Record<string, unknown>` or a named interface in place of `{}` as a type
- A comment explaining each type assertion (`as X`)
- Double assertions (`as unknown as X`) are a blocking error
- `import type` for type-only imports
- Interfaces preferred over type aliases for object shapes
- Interface names without an `I` prefix

## 5. UX fit and placement (should-fix)

Applies to any change that adds or moves user-facing surface: a control, panel,
tab, widget, toggle, or setting. Ask these before the code questions; a correct
widget in the wrong place still costs every user.

- **Placement matches the information's scope.** Account-level information
  (usage, plan, billing, identity) lives in Settings; per-item information
  lives beside the item; global actions live in a global bar.
- **Progressive disclosure.** A surface appears when it has something to show
  and stays hidden otherwise. Prefer detection to a toggle.
- **Scoped to the panels it concerns.** A control for one agent or tool shows
  only where that agent runs.
- **One way to reach it.** One predictable path is the standard. A hidden
  toggle plus a persisted preference plus an auto-open is three behaviours to
  discover.
- **Fits the surface it joins.** A crowded bar stays sparse. A new affordance
  earns its place against what is already there, and joins an existing home
  before creating a rival one.
- **Comparable products.** Where do mature tools put this? A placement no
  comparable product uses needs a stated reason.

Recommend the placement, say why, and give the path to it. The plumbing under a
misplaced surface is usually right and reusable; say so.

## 6. Conventions (suggestion)

- File names match their default export
- `const` by default, `let` only when reassignment is required, no `var`
- No `console.log` in committed code, except intentional server-side logging
- No commented-out code blocks or dead code
- No unused imports or variables
