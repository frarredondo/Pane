import { useCallback, useMemo, useRef } from 'react';
import { useHotkey } from './useHotkey';
import { useSessionStore } from '../stores/sessionStore';
import { useNavigationStore } from '../stores/navigationStore';
import { cycleIndex } from '../utils/arrayUtils';
import type { Session } from '../types/session';
import type { Project } from '../types/project';

interface UseSessionNavigationHotkeysOptions {
  projects: Project[];
  sessionSortAscending: boolean;
}

export function useSessionNavigationHotkeys({
  projects,
  sessionSortAscending,
}: UseSessionNavigationHotkeysOptions): void {
  const sessions = useSessionStore(s => s.sessions);
  const activeSessionId = useSessionStore(s => s.activeSessionId);
  const setActiveSession = useSessionStore(s => s.setActiveSession);
  const navigateToSessions = useNavigationStore(s => s.navigateToSessions);

  const sessionsByProject = useMemo(() => {
    const map = new Map<number, Session[]>();
    sessions
      .filter(s => !s.archived)
      .forEach(s => {
        if (s.projectId != null) {
          const list = map.get(s.projectId) || [];
          list.push(s);
          map.set(s.projectId, list);
        }
      });
    map.forEach((list, key) => {
      map.set(key, list.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sessionSortAscending ? da - db : db - da;
      }));
    });
    return map;
  }, [sessions, sessionSortAscending]);

  const projectById = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach(project => map.set(project.id, project));
    return map;
  }, [projects]);

  const allActiveSessions = useMemo(() => {
    const result: Session[] = [];
    projects.forEach(project => {
      const list = sessionsByProject.get(project.id) || [];
      result.push(...list);
    });
    return result;
  }, [projects, sessionsByProject]);

  const pinnedSessions = useMemo(() => {
    return sessions
      .filter(session => !session.archived && session.isFavorite)
      .map(session => {
        const projectName = session.projectId != null ? projectById.get(session.projectId)?.name : undefined;
        return {
          session,
          label: `${projectName || 'Unknown'}/${session.name || 'Untitled'}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [sessions, projectById]);

  const allActiveSessionsRef = useRef(allActiveSessions);
  allActiveSessionsRef.current = allActiveSessions;
  const pinnedSessionsRef = useRef(pinnedSessions);
  pinnedSessionsRef.current = pinnedSessions;
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const setActiveSessionRef = useRef(setActiveSession);
  setActiveSessionRef.current = setActiveSession;
  const navigateToSessionsRef = useRef(navigateToSessions);
  navigateToSessionsRef.current = navigateToSessions;

  const cycleSession = useCallback((direction: 'next' | 'prev') => {
    const sessions = allActiveSessionsRef.current;
    if (sessions.length === 0) return;

    const currentId = activeSessionIdRef.current;
    const currentIndex = sessions.findIndex(s => s.id === currentId);
    const nextIndex = cycleIndex(currentIndex, sessions.length, direction);
    if (nextIndex === -1) return;

    setActiveSessionRef.current(sessions[nextIndex].id);
    navigateToSessionsRef.current();
  }, []);

  const cyclePinnedOrAllSessions = useCallback((direction: 'next' | 'prev') => {
    const pinned = pinnedSessionsRef.current.map(item => item.session);
    const sessions = pinned.length > 0 ? pinned : allActiveSessionsRef.current;
    if (sessions.length === 0) return;

    const currentId = activeSessionIdRef.current;
    const currentIndex = sessions.findIndex(s => s.id === currentId);
    const nextIndex = cycleIndex(currentIndex, sessions.length, direction);
    if (nextIndex === -1) return;

    setActiveSessionRef.current(sessions[nextIndex].id);
    navigateToSessionsRef.current();
  }, []);

  useHotkey({
    id: 'cycle-session-next-0',
    label: 'Next Pane',
    keys: 'mod+Tab',
    category: 'session',
    enabled: () => allActiveSessionsRef.current.length > 1,
    action: () => cycleSession('next'),
  });

  useHotkey({
    id: 'cycle-session-prev-0',
    label: 'Previous Pane',
    keys: 'mod+shift+Tab',
    category: 'session',
    enabled: () => allActiveSessionsRef.current.length > 1,
    action: () => cycleSession('prev'),
  });

  useHotkey({
    id: 'cycle-pinned-or-all-next',
    label: 'Next Pinned Pane',
    keys: 'mod+ArrowDown',
    category: 'session',
    enabled: () => {
      const pinnedCount = pinnedSessionsRef.current.length;
      return pinnedCount > 1 || (pinnedCount === 0 && allActiveSessionsRef.current.length > 1);
    },
    action: () => cyclePinnedOrAllSessions('next'),
  });

  useHotkey({
    id: 'cycle-pinned-or-all-prev',
    label: 'Previous Pinned Pane',
    keys: 'mod+ArrowUp',
    category: 'session',
    enabled: () => {
      const pinnedCount = pinnedSessionsRef.current.length;
      return pinnedCount > 1 || (pinnedCount === 0 && allActiveSessionsRef.current.length > 1);
    },
    action: () => cyclePinnedOrAllSessions('prev'),
  });
}
