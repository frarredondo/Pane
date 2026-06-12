/**
 * PanelTabStrip: renders a horizontal strip of panel tab items.
 *
 * Shared by the primary group (via PanelTabBar) and secondary groups
 * (via PanelGroupView) so there is one tab-rendering implementation.
 */

import React, { useCallback, useState, useRef, useMemo } from 'react';
import { X, Terminal, GitBranch, FileCode, FolderTree, BarChart3, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ToolPanel, ToolPanelType, LogsPanelState } from '../../../../shared/types/panels';
import { useHotkeyStore } from '../../stores/hotkeyStore';
import { formatKeyDisplay } from '../../utils/hotkeyUtils';
import { Tooltip } from '../ui/Tooltip';
import { Kbd } from '../ui/Kbd';
import { usePanelStore } from '../../stores/panelStore';
import { ClaudeIcon, OpenAIIcon } from '../ui/BrandIcons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanelTabStripProps {
  /** Panels in layout order (no re-sort). */
  panels: ToolPanel[];
  /** Currently active (visible) panel in this group. */
  activePanelId: string | null;
  /** Called when the user clicks a tab. */
  onPanelSelect: (panel: ToolPanel) => void;
  /** Called when the user clicks a tab's close button. */
  onPanelClose: (panel: ToolPanel) => void;
  /** Whether this is the primary group (shown in PanelTabBar; hides shortcut hints in strip). */
  isPrimary?: boolean;
  /** Whether this strip is inside a focused group. */
  isFocused?: boolean;
  /** Show shortcut hints (only for primary group in PanelTabBar). */
  showShortcutHints?: boolean;

  // --- Drag-and-drop ---
  /** Called when a drag starts on a tab. */
  onDragStart?: (panelId: string) => void;
  /** Called when a drag ends (regardless of drop). */
  onDragEnd?: () => void;
  /** Called when a tab is dropped onto the strip (reorder). */
  onStripDrop?: (panelId: string, insertIndex: number) => void;
  /** Whether a tab drag is currently in progress (to show drop targets). */
  isTabDragging?: boolean;
  /** The panel id being dragged (to highlight the source). */
  draggedPanelId?: string | null;
}

// ---------------------------------------------------------------------------
// Icon helper (existing icons from PanelTabBar)
// ---------------------------------------------------------------------------

function getPanelIcon(type: ToolPanelType, panel?: ToolPanel): React.ReactNode {
  switch (type) {
    case 'terminal': {
      if (panel?.title) {
        const lowerTitle = panel.title.toLowerCase();
        if (lowerTitle.includes('claude')) return <ClaudeIcon className="w-4 h-4" />;
        if (lowerTitle.includes('codex')) return <OpenAIIcon className="w-4 h-4" />;
      }
      return <Terminal className="w-4 h-4" />;
    }
    case 'diff':
      return <GitBranch className="w-4 h-4" />;
    case 'explorer':
      return <FolderTree className="w-4 h-4" />;
    case 'logs':
      return <FileCode className="w-4 h-4" />;
    case 'dashboard':
      return <BarChart3 className="w-4 h-4" />;
    case 'browser':
      return <Globe className="w-4 h-4" />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PanelTabStrip: React.FC<PanelTabStripProps> = React.memo(({
  panels,
  activePanelId,
  onPanelSelect,
  onPanelClose,
  isPrimary = false,
  isFocused = false,
  showShortcutHints = false,
  onDragStart,
  onDragEnd,
  onStripDrop,
  isTabDragging = false,
  draggedPanelId = null,
}) => {
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [stripDropIndex, setStripDropIndex] = useState<number | null>(null);
  const getPanelActivityStatus = usePanelStore(s => s.getPanelActivityStatus);

  const hotkeys = useHotkeyStore(s => s.hotkeys);
  const hotkeyDisplay = useCallback((id: string) => {
    const keys = hotkeys.get(id)?.keys;
    return keys ? formatKeyDisplay(keys) : null;
  }, [hotkeys]);

  // --- Rename handlers ---
  const handleStartRename = useCallback((e: React.MouseEvent, panel: ToolPanel) => {
    e.stopPropagation();
    if (panel.type === 'diff') return;
    setEditingPanelId(panel.id);
    setEditingTitle(panel.title);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (editingPanelId && editingTitle.trim()) {
      try {
        await window.electron?.invoke('panels:update', editingPanelId, {
          title: editingTitle.trim()
        });
        const panel = panels.find(p => p.id === editingPanelId);
        if (panel) {
          panel.title = editingTitle.trim();
        }
      } catch (error) {
        console.error('Failed to rename panel:', error);
      }
    }
    setEditingPanelId(null);
    setEditingTitle('');
  }, [editingPanelId, editingTitle, panels]);

  const handleRenameCancel = useCallback(() => {
    setEditingPanelId(null);
    setEditingTitle('');
  }, []);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSubmit, handleRenameCancel]);

  // --- Close handler ---
  const handlePanelClose = useCallback((e: React.MouseEvent, panel: ToolPanel) => {
    e.stopPropagation();
    // Prevent closing logs panel while it's running
    if (panel.type === 'logs') {
      const logsState = panel.state?.customState as LogsPanelState;
      if (logsState?.isRunning) {
        alert('Cannot close logs panel while process is running. Please stop the process first.');
        return;
      }
    }
    onPanelClose(panel);
  }, [onPanelClose]);

  // --- Drag handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, panelId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', panelId);
    onDragStart?.(panelId);
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
    setStripDropIndex(null);
  }, [onDragEnd]);

  const handleStripDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!isTabDragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setStripDropIndex(index);
  }, [isTabDragging]);

  const handleStripDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPanelId && onStripDrop) {
      onStripDrop(draggedPanelId, index);
    }
    setStripDropIndex(null);
  }, [draggedPanelId, onStripDrop]);

  const handleStripDragLeave = useCallback(() => {
    setStripDropIndex(null);
  }, []);

  // Focus the rename input when it appears
  const setEditInputRefCallback = useCallback((el: HTMLInputElement | null) => {
    editInputRef.current = el;
    if (el) el.focus();
  }, []);

  // Shortcut hints are only truthful when the hotkeys actually target this
  // strip's panels: Mod+Shift+1-9 act on the focused group, so hide hints
  // while a different group has focus.
  const shortcutHintsEnabled = showShortcutHints && isPrimary && isFocused;

  // Memoize the shortcut hints
  const shortcutHints = useMemo(() => {
    if (!shortcutHintsEnabled) return [];
    return panels.map((_, index) =>
      index < 9 ? hotkeyDisplay(`panel-tab-${index + 1}`) ?? undefined : undefined
    );
  }, [shortcutHintsEnabled, panels, hotkeyDisplay]);

  return (
    <div
      className="flex items-center overflow-x-auto scrollbar-none min-w-0 flex-1"
      onDragLeave={handleStripDragLeave}
    >
      {panels.map((panel, index) => {
        const isPermanent = panel.metadata?.permanent === true;
        const isEditing = editingPanelId === panel.id;
        const isDiffPanel = panel.type === 'diff';
        const displayTitle = isDiffPanel ? 'Diff' : panel.title;
        const isActive = panel.id === activePanelId;
        const isDragged = panel.id === draggedPanelId;
        const isCompactTab = panel.type === 'diff' || panel.type === 'explorer' || panel.type === 'browser';
        const shortcutHint = shortcutHints[index];

        const tab = (
          <div
            className={cn(
              "group relative inline-flex items-center h-[var(--panel-tab-height)] justify-center whitespace-nowrap cursor-pointer select-none",
              isCompactTab
                ? cn("min-w-[5rem] text-xs", isPermanent ? "px-2" : "px-2 pr-6")
                : cn("min-w-[8rem] text-sm", isPermanent ? "px-3" : "px-3 pr-7"),
              isActive
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-primary hover:bg-surface-hover",
              isDragged && "opacity-50",
            )}
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, panel.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleStripDragOver(e, index)}
            onDrop={(e) => handleStripDrop(e, index)}
            onClick={() => !isEditing && onPanelSelect(panel)}
            onDoubleClick={(e) => {
              if (!isEditing && !isPermanent && !isDiffPanel) {
                handleStartRename(e, panel);
              }
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => {
              if (isEditing) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPanelSelect(panel);
              }
            }}
          >
            {/* Strip drop indicator line */}
            {isTabDragging && stripDropIndex === index && (
              <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-interactive z-10" />
            )}

            {isEditing ? (
              <input
                ref={setEditInputRefCallback}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                className="px-1 text-sm bg-bg-primary border border-border-primary rounded outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus text-text-primary"
                onClick={(e) => e.stopPropagation()}
                style={{ width: `${Math.max(50, editingTitle.length * 8)}px` }}
              />
            ) : (
              <span className="inline-flex items-center justify-center gap-2 min-w-0">
                {panel.type === 'terminal' && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all",
                    getPanelActivityStatus(panel.id) === 'active'
                      ? 'bg-status-info opacity-100 duration-150'
                      : 'bg-text-muted/20 opacity-40 duration-[3s]'
                  )} />
                )}
                {getPanelIcon(panel.type, panel)}
                <span>{displayTitle}</span>
              </span>
            )}

            {!isPermanent && !isEditing && (
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity transition-colors text-text-muted hover:bg-surface-hover hover:text-status-error focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-subtle"
                onClick={(e) => handlePanelClose(e, panel)}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );

        const showDividerAfter = panel.type === 'browser';
        const divider = showDividerAfter ? (
          <div className="h-4 w-px bg-border-primary mx-1 flex-shrink-0" aria-hidden="true" />
        ) : null;

        return shortcutHint ? (
          <React.Fragment key={panel.id}>
            <Tooltip
              content={
                <span className="flex flex-col items-start gap-1">
                  <span className="text-text-secondary">{displayTitle}</span>
                  <Kbd size="xs" variant="muted" className="origin-left scale-[0.8]">{shortcutHint}</Kbd>
                </span>
              }
              side="bottom"
            >
              {tab}
            </Tooltip>
            {divider}
          </React.Fragment>
        ) : <React.Fragment key={panel.id}>{tab}{divider}</React.Fragment>;
      })}
    </div>
  );
});

PanelTabStrip.displayName = 'PanelTabStrip';
