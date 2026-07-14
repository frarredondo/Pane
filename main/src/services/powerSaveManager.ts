import { powerSaveBlocker } from 'electron';
import type { EventEmitter } from 'events';
import type { AppConfig } from '../types/config';
import type { Session } from '../types/session';

const ACTIVE_SESSION_STATUSES = new Set<Session['status']>([
  'initializing',
  'ready',
  'running',
  'waiting',
]);

interface PowerSaveConfigSource extends EventEmitter {
  getConfig(): AppConfig;
}

type PowerSaveSessionSource = EventEmitter;

export class PowerSaveManager {
  private readonly statuses = new Map<string, Session['status']>();
  private blockerId: number | null = null;

  private readonly handleSessionsLoaded = (sessions: Session[]): void => {
    this.statuses.clear();
    for (const session of sessions) {
      this.statuses.set(session.id, session.status);
    }
    this.sync();
  };

  private readonly handleSessionChanged = (session: Session): void => {
    this.statuses.set(session.id, session.status);
    this.sync();
  };

  private readonly handleSessionDeleted = (session: Pick<Session, 'id'>): void => {
    this.statuses.delete(session.id);
    this.sync();
  };

  private readonly handleConfigUpdated = (): void => {
    this.sync();
  };

  constructor(
    private readonly configManager: PowerSaveConfigSource,
    private readonly sessionManager: PowerSaveSessionSource,
  ) {
    this.sessionManager.on('sessions-loaded', this.handleSessionsLoaded);
    this.sessionManager.on('session-created', this.handleSessionChanged);
    this.sessionManager.on('session-updated', this.handleSessionChanged);
    this.sessionManager.on('session-deleted', this.handleSessionDeleted);
    this.configManager.on('config-updated', this.handleConfigUpdated);
  }

  sync(): void {
    const enabled = this.configManager.getConfig().keepAwakeWhileSessionsActive !== false;
    const hasActiveSession = Array.from(this.statuses.values()).some(status =>
      ACTIVE_SESSION_STATUSES.has(status)
    );
    const shouldBlockSleep = enabled && hasActiveSession;

    if (shouldBlockSleep && this.blockerId === null) {
      this.blockerId = powerSaveBlocker.start('prevent-app-suspension');
    } else if (!shouldBlockSleep && this.blockerId !== null) {
      powerSaveBlocker.stop(this.blockerId);
      this.blockerId = null;
    }
  }

  dispose(): void {
    this.sessionManager.removeListener('sessions-loaded', this.handleSessionsLoaded);
    this.sessionManager.removeListener('session-created', this.handleSessionChanged);
    this.sessionManager.removeListener('session-updated', this.handleSessionChanged);
    this.sessionManager.removeListener('session-deleted', this.handleSessionDeleted);
    this.configManager.removeListener('config-updated', this.handleConfigUpdated);

    if (this.blockerId !== null) {
      powerSaveBlocker.stop(this.blockerId);
      this.blockerId = null;
    }
  }
}
