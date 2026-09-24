# Specialist review lenses

Use these for an explicitly requested comprehensive review, or when a large
change benefits from independent expertise across several layers. Pick the
lenses that apply to the change. Each lens is a scope for a `refactor-deep`
subagent; none is a separate agent type.

| Lens | Question to investigate |
| --- | --- |
| Reuse | Does nearby code already solve this problem, and would reuse preserve behavior? |
| Clarity | Which changed control or data flow is hard to follow, and what concrete error or maintenance risk results? |
| Scope | Does the implementation deliver the requested outcome with no unrelated changes? |
| Anti-patterns | Does new code break a demonstrated repository convention or create a correctness defect? |
| Consistent patterns | Does this add a competing implementation of an existing operation without a reason? |
| Backend architecture | Are service boundaries, persistence, transactions, and failure paths coherent? |
| Frontend architecture | Are state ownership, rendering, accessibility, and user flows coherent? |
| Documentation | Do public contracts and usage instructions match the changed behavior? |
| Circular dependencies | Do new imports create cycles or runtime initialization hazards? |
| Self-contained components | Are responsibilities and dependencies explicit at the repository's component and module boundaries? |
| Query/cache behavior | When a query or cache library is used, are keys, invalidation, errors, and mutation lifecycles correct? |

## Dispatch

- Give each lens a fresh subagent running `refactor-deep`, with that lens as
  an explicit scope override.
- Give every lens the same base, head, and tracked and untracked file
  inventory. Keep peer findings out of each prompt.
- Match the frontend, backend, and query lenses to the actual stack.
- Repository evidence sets conventions and severity. Line-count rules and any
  preferred architecture are repository choices, not universal requirements.
- Run the lenses in waves within available capacity.

## Output

Lens subagents inspect and return findings. They edit no code, post no
reviews, repeat no checks, and spawn no helpers. Each returns:

- the lens and the reviewed revision
- the report path
- findings with `file:line` evidence, impact, proposed fix, and an
  auto-fixable flag
- remaining uncertainty

The parent reconciles once, using the merge rules in
[the refactor skill](../SKILL.md). A missing or failed lens stays explicitly
unverified in the merged report.
