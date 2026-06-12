import { ToolPanel, SessionPanelLayout } from '../../../shared/types/panels';

export interface PanelStore {
  // State (using plain objects instead of Maps for React reactivity)
  panels: Record<string, ToolPanel[]>;        // sessionId -> panels
  activePanels: Record<string, string>;       // sessionId -> active panelId
  activityStatus: Record<string, 'active' | 'idle'>; // panelId -> status
  lastActivityAt: Record<string, string>;     // panelId -> last PTY output timestamp

  // Layout state for split tab groups
  layouts: Record<string, SessionPanelLayout>;   // sessionId -> layout tree
  focusedGroupIds: Record<string, string>;        // sessionId -> focused group id

  // Synchronous state update actions
  setPanels: (sessionId: string, panels: ToolPanel[]) => void;
  setActivePanel: (sessionId: string, panelId: string) => void;
  addPanel: (panel: ToolPanel) => void;
  removePanel: (sessionId: string, panelId: string) => void;
  updatePanelState: (panel: ToolPanel) => void;
  setActivityStatus: (panelId: string, status: 'active' | 'idle', lastActivityAt?: string) => void;
  clearActivityStatus: (panelId: string) => void;

  // Layout actions
  setLayout: (sessionId: string, layout: SessionPanelLayout) => void;
  setFocusedGroup: (sessionId: string, groupId: string) => void;

  // Getters
  getSessionPanels: (sessionId: string) => ToolPanel[];
  getActivePanel: (sessionId: string) => ToolPanel | undefined;
  getPanelActivityStatus: (panelId: string) => 'active' | 'idle';
  getSessionActivityStatus: (sessionId: string) => 'active' | 'idle';
  getLayout: (sessionId: string) => SessionPanelLayout | undefined;
  getFocusedGroupId: (sessionId: string) => string | undefined;
}
