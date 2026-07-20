import type { App, BrowserWindow } from 'electron';
import type { CoreServices } from '../core/services';
import type { TaskQueue } from '../services/taskQueue';
import type { SpotlightManager } from '../services/spotlightManager';

export interface DaemonHostServices extends CoreServices {
  taskQueue: TaskQueue | null;
  getMainWindow: () => BrowserWindow | null;
  spotlightManager: SpotlightManager;
}

export interface AppServices extends DaemonHostServices {
  app: App;
}
