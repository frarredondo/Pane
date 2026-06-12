import { ToolPanel, ToolPanelType } from '../../../shared/types/panels';

export type PanelContext = 'project' | 'worktree';

export interface PanelCreateOptions {
  initialCommand?: string;  // Command to run on terminal init
  title?: string;           // Custom panel title
}

export interface PanelTabBarProps {
  panels: ToolPanel[];
  activePanel?: ToolPanel;
  onPanelSelect: (panel: ToolPanel) => void;
  onPanelClose: (panel: ToolPanel) => void;
  onPanelCreate: (type: ToolPanelType, options?: PanelCreateOptions) => void;
  context?: PanelContext;  // Optional context to filter available panels
  onToggleDetailPanel?: () => void;
  detailPanelVisible?: boolean;

  // --- Optional split tab group integration ---
  /** Panels in layout order for the primary group (overrides internal sort). */
  primaryGroupPanels?: ToolPanel[];
  /** Active panel id for the primary group (overrides activePanel check). */
  primaryGroupActivePanelId?: string | null;
  /** Whether the primary group is the focused group (gates shortcut hints). */
  primaryGroupFocused?: boolean;
  /** Called when a drag starts on a tab. */
  onDragStart?: (panelId: string) => void;
  /** Called when a drag ends. */
  onDragEnd?: () => void;
  /** Called when a tab is dropped onto the strip. */
  onStripDrop?: (panelId: string, insertIndex: number) => void;
  /** Whether a tab drag is currently in progress. */
  isTabDragging?: boolean;
  /** The panel id being dragged. */
  draggedPanelId?: string | null;
}

export interface PanelContainerProps {
  panel: ToolPanel;
  isActive: boolean;
  isMainRepo?: boolean;
  autoFocus?: boolean;
}

export interface TerminalPanelProps {
  panel: ToolPanel;
  isActive: boolean;
  autoFocus?: boolean;
}
