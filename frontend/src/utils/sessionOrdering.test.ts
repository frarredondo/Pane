import { describe, expect, it } from 'vitest';
import type { Project } from '../types/project';
import type { Session } from '../types/session';
import {
  flattenSessionsByProjects,
  getPinnedSessions,
  groupSessionsByProject,
} from './sessionOrdering';

function session(overrides: Partial<Session> & Pick<Session, 'id' | 'projectId'>): Session {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    worktreePath: '',
    prompt: '',
    status: 'stopped',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    output: [],
    jsonMessages: [],
    projectId: overrides.projectId,
    displayOrder: overrides.displayOrder,
    isFavorite: overrides.isFavorite,
    favoritePinnedAt: overrides.favoritePinnedAt,
    archived: overrides.archived,
  };
}

function project(id: number, name = `Project ${id}`): Project {
  return {
    id,
    name,
    path: '',
    active: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('sessionOrdering', () => {
  it('orders sessions by displayOrder in the default ascending view', () => {
    const grouped = groupSessionsByProject([
      session({ id: 'newer', projectId: 1, displayOrder: 2, createdAt: '2026-01-03T00:00:00.000Z' }),
      session({ id: 'older', projectId: 1, displayOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' }),
      session({ id: 'middle', projectId: 1, displayOrder: 1, createdAt: '2026-01-02T00:00:00.000Z' }),
    ], true);

    expect(grouped.get(1)?.map(item => item.id)).toEqual(['older', 'middle', 'newer']);
  });

  it('keeps newest-first sorting when the user flips the sort direction', () => {
    const grouped = groupSessionsByProject([
      session({ id: 'newer', projectId: 1, displayOrder: 2, createdAt: '2026-01-03T00:00:00.000Z' }),
      session({ id: 'older', projectId: 1, displayOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' }),
      session({ id: 'middle', projectId: 1, displayOrder: 1, createdAt: '2026-01-02T00:00:00.000Z' }),
    ], false);

    expect(grouped.get(1)?.map(item => item.id)).toEqual(['newer', 'middle', 'older']);
  });

  it('uses createdAt sort when displayOrder is absent', () => {
    const grouped = groupSessionsByProject([
      session({ id: 'old', projectId: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
      session({ id: 'new', projectId: 1, createdAt: '2026-01-03T00:00:00.000Z' }),
    ], false);

    expect(grouped.get(1)?.map(item => item.id)).toEqual(['new', 'old']);
  });

  it('flattens sessions in project order while respecting collapsed projects', () => {
    const projects = [project(2), project(1)];
    const grouped = groupSessionsByProject([
      session({ id: 'one', projectId: 1, displayOrder: 0 }),
      session({ id: 'two', projectId: 2, displayOrder: 0 }),
    ], true);

    expect(flattenSessionsByProjects(projects, grouped).map(item => item.id)).toEqual(['two', 'one']);
    expect(flattenSessionsByProjects(projects, grouped, new Set([1])).map(item => item.id)).toEqual(['one']);
  });

  it('orders pinned rows by newest pin first', () => {
    const projects = new Map([
      [1, project(1, 'Zed')],
      [2, project(2, 'Alpha')],
    ]);

    const pinned = getPinnedSessions([
      session({ id: 'older', name: 'Pane', projectId: 1, isFavorite: true, favoritePinnedAt: '2026-01-01T00:00:00.000Z' }),
      session({ id: 'newer', name: 'Pane', projectId: 2, isFavorite: true, favoritePinnedAt: '2026-01-03T00:00:00.000Z' }),
      session({ id: 'unpinned', projectId: 1, isFavorite: false }),
    ], projects);

    expect(pinned.map(item => item.session.id)).toEqual(['newer', 'older']);
  });

  it('falls back to createdAt for pinned rows without a pin timestamp', () => {
    const projects = new Map([[1, project(1, 'Project')]]);

    const pinned = getPinnedSessions([
      session({ id: 'old', projectId: 1, isFavorite: true, createdAt: '2026-01-01T00:00:00.000Z' }),
      session({ id: 'new', projectId: 1, isFavorite: true, createdAt: '2026-01-03T00:00:00.000Z' }),
    ], projects);

    expect(pinned.map(item => item.session.id)).toEqual(['new', 'old']);
  });
});
