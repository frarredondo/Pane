/**
 * Pure keyboard-navigation helpers for the Dropdown menu.
 *
 * Kept free of React/DOM so the focus-movement rules (wrapping, skipping
 * disabled items, seeding the active item from the current selection) can be
 * unit-tested directly. Dropdown.tsx owns the actual focus() calls and event
 * wiring; this module only answers "which index should be active next?".
 */

export interface NavigableItem {
  id: string;
  disabled?: boolean;
}

/** First enabled index, or -1 if every item is disabled/empty. */
export function firstEnabledIndex(items: NavigableItem[]): number {
  return items.findIndex((item) => !item.disabled);
}

/**
 * Next enabled index moving by `step` (+1 down, -1 up) from `current`, wrapping
 * around the ends and skipping disabled items. Returns -1 if no item is enabled.
 */
export function nextEnabledIndex(
  items: NavigableItem[],
  current: number,
  step: 1 | -1,
): number {
  const n = items.length;
  if (n === 0) return -1;

  let idx = current;
  for (let i = 0; i < n; i++) {
    idx = (idx + step + n) % n;
    if (!items[idx].disabled) return idx;
  }

  // No other enabled item; stay put if `current` itself is valid+enabled.
  return current >= 0 && current < n && !items[current].disabled ? current : -1;
}

/**
 * Index to activate when the menu opens: the currently selected item (if it is
 * present and enabled), otherwise the first enabled item.
 */
export function initialActiveIndex(
  items: NavigableItem[],
  selectedId?: string,
): number {
  if (selectedId !== undefined) {
    const selected = items.findIndex(
      (item) => item.id === selectedId && !item.disabled,
    );
    if (selected !== -1) return selected;
  }
  return firstEnabledIndex(items);
}
