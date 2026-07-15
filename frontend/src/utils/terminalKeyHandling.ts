export const TERMINAL_MULTILINE_NEWLINE_SEQUENCE = '\x1b\r';

export type TerminalKeyHandlingDecision =
  | { action: 'continue' }
  | { action: 'pass-through' }
  | { action: 'block' }
  | { action: 'send-input'; input: string };

export interface TerminalKeyHandlingState {
  isTuiActive: boolean;
  isCliPanel: boolean;
}

export interface TerminalKeyLike {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export function resolveTerminalKeyHandling(
  event: TerminalKeyLike,
  state: TerminalKeyHandlingState,
): TerminalKeyHandlingDecision {
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const shiftEnter = event.shiftKey && !ctrlOrMeta && event.key === 'Enter';

  if (shiftEnter && (!state.isTuiActive || state.isCliPanel)) {
    return { action: 'send-input', input: TERMINAL_MULTILINE_NEWLINE_SEQUENCE };
  }

  if (state.isTuiActive) {
    if (ctrlOrMeta && event.key.toLowerCase() === 'v') {
      return { action: 'block' };
    }

    return { action: 'pass-through' };
  }

  return { action: 'continue' };
}
