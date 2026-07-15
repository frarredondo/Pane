import { describe, expect, it } from 'vitest';
import {
  resolveTerminalKeyHandling,
  TERMINAL_MULTILINE_NEWLINE_SEQUENCE,
  type TerminalKeyLike,
} from './terminalKeyHandling';

const key = (overrides: Partial<TerminalKeyLike>): TerminalKeyLike => ({
  key: 'a',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  ...overrides,
});

describe('resolveTerminalKeyHandling', () => {
  it('sends the multiline sequence for Shift+Enter outside TUI mode', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'Enter', shiftKey: true }),
      { isTuiActive: false, isCliPanel: false },
    )).toEqual({ action: 'send-input', input: TERMINAL_MULTILINE_NEWLINE_SEQUENCE });
  });

  it('sends the multiline sequence for CLI agent panels in TUI mode', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'Enter', shiftKey: true }),
      { isTuiActive: true, isCliPanel: true },
    )).toEqual({ action: 'send-input', input: TERMINAL_MULTILINE_NEWLINE_SEQUENCE });
  });

  it('passes Shift+Enter through for ordinary TUI apps', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'Enter', shiftKey: true }),
      { isTuiActive: true, isCliPanel: false },
    )).toEqual({ action: 'pass-through' });
  });

  it('does not swallow Ctrl+Shift+Enter chords', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'Enter', shiftKey: true, ctrlKey: true }),
      { isTuiActive: true, isCliPanel: true },
    )).toEqual({ action: 'pass-through' });
  });

  it('blocks Cmd/Ctrl+V in TUI mode so native paste can run', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'v', metaKey: true }),
      { isTuiActive: true, isCliPanel: true },
    )).toEqual({ action: 'block' });
  });

  it('passes Ctrl+C through in TUI mode so fullscreen apps can handle interrupts', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: 'c', ctrlKey: true }),
      { isTuiActive: true, isCliPanel: true },
    )).toEqual({ action: 'pass-through' });
  });

  it('continues to later terminal shortcut handling outside TUI mode', () => {
    expect(resolveTerminalKeyHandling(
      key({ key: '1', metaKey: true }),
      { isTuiActive: false, isCliPanel: true },
    )).toEqual({ action: 'continue' });
  });
});
