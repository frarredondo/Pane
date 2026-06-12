/**
 * PanelGroupView: renders a single tab group within the split layout.
 *
 * Each group has:
 * - A slim centered tab strip row (compact pill-style tabs) once the pane is
 *   split. It occupies a layout row so it pushes content down instead of
 *   covering it. Single-group panes render no strip here; their tabs live in
 *   PanelTabBar (the pixel-identical rule).
 * - An absolute-positioned panel stack (the editor-stage pattern: inactive
 *   terminals stay mounted behind display:none so xterm never reflows).
 * - A DropOverlay when a tab drag is in progress.
 * - A drag shield to intercept mouse events from webviews/xterm during drags.
 */

import React, { useCallback, useMemo } from 'react';
import { PanelTabStrip } from './PanelTabStrip';
import { PanelContainer } from './PanelContainer';
import type { ToolPanel, PanelGroupNode } from '../../../../shared/types/panels';
import { dropZoneFor, type DropZone } from '../../utils/panelLayout';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// DropOverlay
// ---------------------------------------------------------------------------

interface DropOverlayProps {
  onZoneChange: (zone: DropZone | null) => void;
  onDrop: (zone: DropZone) => void;
  activeZone: DropZone | null;
}

const DropOverlay: React.FC<DropOverlayProps> = React.memo(({ onZoneChange, onDrop, activeZone }) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    onZoneChange(dropZoneFor(e.clientX, e.clientY, rect));
  }, [onZoneChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (activeZone) {
      onDrop(activeZone);
    }
  }, [activeZone, onDrop]);

  const handleDragLeave = useCallback(() => {
    onZoneChange(null);
  }, [onZoneChange]);

  return (
    <div
      className="absolute inset-0 z-20"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {/* Zone highlight overlays */}
      {activeZone === 'center' && (
        <div className="absolute inset-4 border-2 border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-interactive-primary)_10%,transparent)] rounded pointer-events-none" />
      )}
      {activeZone === 'left' && (
        <div className="absolute inset-y-0 left-0 w-1/4 border-2 border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-interactive-primary)_10%,transparent)] pointer-events-none" />
      )}
      {activeZone === 'right' && (
        <div className="absolute inset-y-0 right-0 w-1/4 border-2 border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-interactive-primary)_10%,transparent)] pointer-events-none" />
      )}
      {activeZone === 'top' && (
        <div className="absolute inset-x-0 top-0 h-1/4 border-2 border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-interactive-primary)_10%,transparent)] pointer-events-none" />
      )}
      {activeZone === 'bottom' && (
        <div className="absolute inset-x-0 bottom-0 h-1/4 border-2 border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-interactive-primary)_10%,transparent)] pointer-events-none" />
      )}
    </div>
  );
});

DropOverlay.displayName = 'DropOverlay';

// ---------------------------------------------------------------------------
// PanelGroupView
// ---------------------------------------------------------------------------

export interface PanelGroupViewProps {
  group: PanelGroupNode;
  /** All panels available for this group (resolved from panelIds). */
  groupPanels: ToolPanel[];
  /** Whether this is the primary (first) group — its tabs render in PanelTabBar. */
  isPrimary: boolean;
  /** Whether this group has keyboard focus. */
  isFocusedGroup: boolean;
  /**
   * Whether the session layout has more than one group. Gates focus chrome:
   * a single-group session must render pixel-identically to the pre-split UI,
   * so the focus ring only appears once a real split exists.
   */
  multiGroup: boolean;
  /** Whether this is a main repo session. */
  isMainRepo: boolean;

  // --- Tab strip callbacks ---
  onPanelSelect: (panel: ToolPanel) => void;
  onPanelClose: (panel: ToolPanel) => void;

  // --- Focus ---
  onFocusGroup: (groupId: string) => void;

  // --- Drag & drop ---
  isTabDragging?: boolean;
  draggedPanelId?: string | null;
  activeDropZone?: DropZone | null;
  onDropZoneChange?: (groupId: string, zone: DropZone | null) => void;
  onDropTab?: (groupId: string, zone: DropZone) => void;
  onDragStart?: (panelId: string) => void;
  onDragEnd?: () => void;
  onStripDrop?: (panelId: string, insertIndex: number) => void;
}

export const PanelGroupView: React.FC<PanelGroupViewProps> = React.memo(({
  group,
  groupPanels,
  isPrimary,
  isFocusedGroup,
  multiGroup,
  isMainRepo,
  onPanelSelect,
  onPanelClose,
  onFocusGroup,
  isTabDragging = false,
  draggedPanelId = null,
  activeDropZone = null,
  onDropZoneChange,
  onDropTab,
  onDragStart,
  onDragEnd,
  onStripDrop,
}) => {
  const handleMouseDownCapture = useCallback(() => {
    onFocusGroup(group.id);
  }, [onFocusGroup, group.id]);

  const handleZoneChange = useCallback((zone: DropZone | null) => {
    onDropZoneChange?.(group.id, zone);
  }, [onDropZoneChange, group.id]);

  const handleDrop = useCallback((zone: DropZone) => {
    onDropTab?.(group.id, zone);
  }, [onDropTab, group.id]);

  // Resolve panels in layout order
  const orderedPanels = useMemo(() => {
    const panelMap = new Map(groupPanels.map(p => [p.id, p]));
    return group.panelIds.map(id => panelMap.get(id)).filter((p): p is ToolPanel => !!p);
  }, [group.panelIds, groupPanels]);

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        multiGroup && isFocusedGroup && "ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-interactive-primary)_30%,transparent)]",
      )}
      onMouseDownCapture={handleMouseDownCapture}
    >
      {/* Slim centered tab strip row: once the pane is split, every group
          (primary included) owns its tabs in a compact full-width row that
          pushes content down so it never covers it. */}
      {multiGroup && (
        <div
          role="tablist"
          className="flex-shrink-0 flex justify-center bg-bg-chrome border-b border-border-primary px-2 py-0.5"
        >
          <PanelTabStrip
            panels={orderedPanels}
            activePanelId={group.activePanelId}
            onPanelSelect={onPanelSelect}
            onPanelClose={onPanelClose}
            isPrimary={isPrimary}
            isFocused={isFocusedGroup}
            showShortcutHints={isPrimary}
            variant="pill"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onStripDrop={onStripDrop}
            isTabDragging={isTabDragging}
            draggedPanelId={draggedPanelId}
          />
        </div>
      )}

      {/* Panel content stack: only the active tab is displayed; terminals
          stay mounted behind display:none so xterm never reflows */}
      <div className="flex-1 relative min-h-0 overflow-hidden bg-bg-editor">
        {orderedPanels.map(panel => {
          const isActiveTab = panel.id === group.activePanelId;
          const keepAlive = panel.type === 'terminal';
          if (!isActiveTab && !keepAlive) return null;
          return (
            <div
              key={panel.id}
              className="absolute inset-0"
              style={{
                display: isActiveTab ? 'block' : 'none',
                pointerEvents: isActiveTab ? 'auto' : 'none',
              }}
            >
              <PanelContainer
                panel={panel}
                isActive={isActiveTab}
                autoFocus={isFocusedGroup && isActiveTab}
                isMainRepo={isMainRepo}
              />
            </div>
          );
        })}

        {/* Drag shield: prevents webview/xterm from swallowing drag events */}
        {isTabDragging && (
          <div className="absolute inset-0 z-10" style={{ background: 'transparent' }} />
        )}

        {/* Drop overlay: 5-zone targeting */}
        {isTabDragging && (
          <DropOverlay
            onZoneChange={handleZoneChange}
            onDrop={handleDrop}
            activeZone={activeDropZone}
          />
        )}

        {/* Empty state */}
        {orderedPanels.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-text-secondary h-full">
            <div className="text-center p-4">
              <p className="text-sm">Empty group</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PanelGroupView.displayName = 'PanelGroupView';
