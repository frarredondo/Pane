import { beforeEach, describe, expect, it } from 'vitest';
import type { Session } from '../types/session';
import { useSessionStore } from './sessionStore';

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-new',
    name: 'New pane',
    worktreePath: '/repo/worktrees/new-pane',
    prompt: '',
    status: 'stopped',
    createdAt: '2026-01-01T00:00:00.000Z',
    output: [],
    jsonMessages: [],
    ...overrides,
  };
}

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      activeSessionId: null,
      activeMainRepoSession: null,
      isLoaded: false,
      terminalOutput: {},
      deletingSessionIds: new Set(),
      gitStatusLoading: new Set(),
      pendingGitStatusLoading: new Map(),
      pendingGitStatusUpdates: new Map(),
      gitStatusBatchTimer: null,
      activeSpotlights: new Map(),
    });
  });

  it('keeps the current active pane when a background-created session arrives', () => {
    useSessionStore.setState({ activeSessionId: 'session-existing' });

    useSessionStore.getState().addSession(session({
      id: 'session-background',
      activateOnCreate: false,
    }));

    const state = useSessionStore.getState();
    expect(state.sessions[0].id).toBe('session-background');
    expect(state.activeSessionId).toBe('session-existing');
  });

  it('activates newly created sessions by default', () => {
    useSessionStore.setState({ activeSessionId: 'session-existing' });

    useSessionStore.getState().addSession(session({
      id: 'session-foreground',
    }));

    expect(useSessionStore.getState().activeSessionId).toBe('session-foreground');
  });
});
