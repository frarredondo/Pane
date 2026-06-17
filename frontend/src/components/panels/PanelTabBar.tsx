import React, { useCallback, memo, useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Terminal, ChevronDown, ChevronRight, GitBranch, FileCode, BarChart3, PanelRight, FolderTree, TerminalSquare, Play, Cpu, RefreshCw, Globe } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useHotkey } from '../../hooks/useHotkey';
import { PanelTabBarProps, PanelCreateOptions } from '../../types/panelComponents';
import { ToolPanel, ToolPanelType, PANEL_CAPABILITIES } from '../../../../shared/types/panels';
import { useSession } from '../../contexts/SessionContext';
import { useConfigStore } from '../../stores/configStore';
import { formatKeyDisplay } from '../../utils/hotkeyUtils';
import { useHotkeyStore } from '../../stores/hotkeyStore';
import { Tooltip } from '../ui/Tooltip';
import { Kbd } from '../ui/Kbd';
import { useResourceMonitor } from '../../hooks/useResourceMonitor';
import { ClaudeIcon, OpenAIIcon, CLI_BRAND_ICONS, getCliBrandIcon } from '../ui/BrandIcons';
import { PanelTabStrip } from './PanelTabStrip';
import type { WorktreeFileSyncEntry } from '../../../../shared/types/worktreeFileSync';

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${Math.round(mb)} MB`;
  return `${Math.round(mb * 1024)} KB`;
}

// Build prompt for setting up intelligent dev command — adapts based on Worktree File Sync config
export function buildSetupRunScriptPrompt(fileSyncEntries?: WorktreeFileSyncEntry[]): string {
  const nodeModulesEnabled = fileSyncEntries?.some(e => e.path === 'node_modules' && e.enabled) ?? true;
  const envEnabled = fileSyncEntries?.some(e => e.path.startsWith('.env') && e.enabled) ?? true;

  const depsStep = nodeModulesEnabled
    ? '3. Dependencies are pre-installed by Pane (node_modules is copied and install runs automatically in new worktrees). Just verify freshness — if the lock file has changed since node_modules was last updated, re-run the appropriate install command'
    : '3. Auto-detects if deps need installing (package.json mtime > node_modules mtime)';

  const envNote = envEnabled
    ? '\n- Environment files (.env, .env.local, etc.) are automatically copied from the main repo by Pane — do not prompt the user to create them or warn about missing env files'
    : '';

  return `I use Pane to manage multiple AI coding sessions with git worktrees.
Each worktree needs its own dev server on a unique port.

Create scripts/pane-run-script.js (Node.js, cross-platform) that:
1. Auto-detects git worktrees vs main repo
2. Assigns ports from the PANE_PORT environment variable that Pane injects into every pane terminal: each pane gets its own block of 10 ports starting at PANE_PORT, so PANE_PORT, PANE_PORT+1, ... PANE_PORT+9 are safe to use. Falls back to hash(cwd) % 1000 + base_port (separate ranges for main vs worktrees) only if PANE_PORT is unset
${depsStep}
4. Auto-detects if build is stale (src mtime > dist mtime)
5. Clean Ctrl+C termination (taskkill on Windows, SIGTERM on Unix)
6. Auto-detects project type (package.json, requirements.txt, Cargo.toml, go.mod, etc.)
7. Prints the URL/port being used so user knows where to access the app

CRITICAL EDGE CASES — these cause the most bugs:
- Port availability checks MUST test BOTH 0.0.0.0 AND :: (IPv6) — dev servers often bind to :: (all interfaces), so a check on 127.0.0.1 alone passes but the server fails with EADDRINUSE
- Before auto-incrementing to a new port, try to RECLAIM the preferred port by finding the PID holding it (lsof/netstat), verifying it belongs to this project's dev server (match the command line against the project directory or dev server binary), and only then killing it — never kill unrelated processes
- Clean up stale framework lock files before starting (.next/dev/lock, .cache/lock, .vite/ temp files, etc.) — these are left by crashed/killed sessions and prevent restart
- Cross-platform process management (taskkill /F /T on Windows, kill process group on Unix)${envNote}

Analyze this project's actual framework and structure first, then create the complete pane-run-script.js tailored to it.

IMPORTANT: After creating the script, TEST THE RESTART PATH — run 'node scripts/pane-run-script.js', then kill it ungracefully (Ctrl+C or kill the terminal), then run it again. It must reclaim the same port without EADDRINUSE or lock file errors. A single happy-path run proves nothing. Then commit and merge to main so all future worktrees have it.`;
}

export const PanelTabBar: React.FC<PanelTabBarProps> = memo(({
  panels,
  activePanel,
  onPanelSelect,
  onPanelClose,
  onPanelCreate,
  context = 'worktree',  // Default to worktree for backward compatibility
  onToggleDetailPanel,
  detailPanelVisible,
  // Optional split tab group integration
  primaryGroupPanels,
  primaryGroupActivePanelId,
  primaryGroupFocused,
  tabsInGroups = false,
  onDragStart,
  onDragEnd,
  onStripDrop,
  isTabDragging,
  draggedPanelId,
  getPanelTabPresentation,
}) => {
  const sessionContext = useSession();
  const session = sessionContext?.session;
  const [resolvedRunScript, setResolvedRunScript] = useState<{ command: string; source: string } | null>(null);
  const { config, fetchConfig, updateConfig } = useConfigStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  // Rename state moved to PanelTabStrip
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);
  const [, setFocusedDropdownIndex] = useState(-1);
  const dropdownItemsRef = useRef<(HTMLButtonElement | HTMLInputElement | null)[]>([]);

  // Resource monitor state
  const [showResourcePopover, setShowResourcePopover] = useState(false);
  const resourceChipRef = useRef<HTMLButtonElement>(null);
  const resourcePopoverRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pane-app']));
  const { snapshot, isLoading: resourceLoading, startActive, stopActive, refresh } = useResourceMonitor();
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Activity status moved to PanelTabStrip

  const customCommands = config?.customCommands ?? [];
  const hotkeys = useHotkeyStore((s) => s.hotkeys);
  const hotkeyDisplay = useCallback((id: string) => {
    const keys = hotkeys.get(id)?.keys;
    return keys ? formatKeyDisplay(keys) : null;
  }, [hotkeys]);

  // Load config on mount if not already loaded
  useEffect(() => {
    if (!config) {
      fetchConfig();
    }
  }, [config, fetchConfig]);

  // Resolve run script for current session — re-resolves on session change or project settings update
  const [resolveKey, setResolveKey] = useState(0);
  useEffect(() => {
    const handler = () => setResolveKey(k => k + 1);
    window.addEventListener('project-settings-updated', handler);
    return () => window.removeEventListener('project-settings-updated', handler);
  }, []);
  useEffect(() => {
    if (!session) {
      setResolvedRunScript(null);
      return;
    }
    let cancelled = false;
    const currentSessionId = session.id;
    window.electronAPI?.projects.resolveRunScript(currentSessionId).then((result: { success: boolean; data?: { command: string; source: string } | null }) => {
      if (cancelled) return;
      if (result?.success) {
        setResolvedRunScript(result.data ?? null);
      }
    }).catch(() => {
      if (!cancelled) setResolvedRunScript(null);
    });
    return () => { cancelled = true; };
  }, [session?.id, resolveKey]);

  const saveCustomCommand = useCallback(async (name: string, command: string) => {
    const existing = config?.customCommands ?? [];
    await updateConfig({
      customCommands: [...existing, { name, command }]
    }).catch(() => {});
  }, [config, updateConfig]);

  const deleteCustomCommand = useCallback(async (index: number) => {
    const existing = config?.customCommands ?? [];
    await updateConfig({
      customCommands: existing.filter((_, i) => i !== index)
    }).catch(() => {});
  }, [config, updateConfig]);
  
  // Resource monitor handlers
  const toggleResourcePopover = useCallback(() => {
    if (showResourcePopover) {
      setShowResourcePopover(false);
      stopActive();
      return;
    }

    setShowResourcePopover(true);
    void refresh();
    startActive();
  }, [showResourcePopover, refresh, startActive, stopActive]);

  // Popover positioning
  useEffect(() => {
    if (showResourcePopover && resourceChipRef.current) {
      const rect = resourceChipRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
        zIndex: 10000,
      });
    }
  }, [showResourcePopover]);

  // Click-outside handler for resource popover
  useEffect(() => {
    if (!showResourcePopover) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        resourceChipRef.current && !resourceChipRef.current.contains(target) &&
        resourcePopoverRef.current && !resourcePopoverRef.current.contains(target)
      ) {
        setShowResourcePopover(false);
        stopActive();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClickOutside); };
  }, [showResourcePopover, stopActive]);

  // Add Tool dropdown positioning
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return;
    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 10000,
        minWidth: 280,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showDropdown]);

  // Escape handler for resource popover
  useEffect(() => {
    if (!showResourcePopover) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowResourcePopover(false); stopActive(); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showResourcePopover, stopActive]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => { void refresh(); }, [refresh]);

  const electronTotalCpu = useMemo(() =>
    snapshot?.electronProcesses.reduce((sum, p) => sum + p.cpuPercent, 0) ?? 0
  , [snapshot]);

  const electronTotalMem = useMemo(() =>
    snapshot?.electronProcesses.reduce((sum, p) => sum + p.memoryMB, 0) ?? 0
  , [snapshot]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePanelClick = useCallback((panel: ToolPanel) => {
    onPanelSelect(panel);
  }, [onPanelSelect]);

  // PanelTabStrip owns stopPropagation and the logs-running close guard
  const handlePanelClose = useCallback((panel: ToolPanel) => {
    onPanelClose(panel);
  }, [onPanelClose]);
  
  const handleAddPanel = useCallback((type: ToolPanelType, options?: PanelCreateOptions) => {
    onPanelCreate(type, options);
    setShowDropdown(false);
    setShowCustomInput(false);
    setCustomCommand('');
  }, [onPanelCreate]);
  
  // Rename handlers moved to PanelTabStrip
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target &&
        event.target instanceof Node &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setShowCustomInput(false);
        setCustomCommand('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Auto-focus custom command input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  // Reset focus index when dropdown closes, focus first item when opens
  useEffect(() => {
    if (showDropdown) {
      setFocusedDropdownIndex(0);
      // Focus first item after render
      requestAnimationFrame(() => {
        dropdownItemsRef.current[0]?.focus();
      });
    } else {
      setFocusedDropdownIndex(-1);
      dropdownItemsRef.current = [];
    }
  }, [showDropdown]);

  // Handle keyboard navigation in dropdown
  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = dropdownItemsRef.current.filter(Boolean);
    const itemCount = items.length;

    if (itemCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedDropdownIndex(prev => {
          const next = prev < itemCount - 1 ? prev + 1 : 0;
          items[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedDropdownIndex(prev => {
          const next = prev > 0 ? prev - 1 : itemCount - 1;
          items[next]?.focus();
          return next;
        });
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      case 'Tab':
        // Allow tab to close dropdown and move to next element
        setShowDropdown(false);
        break;
    }
  }, []);
  
  // Ctrl+T: open Add Tool dropdown
  useHotkey({
    id: 'open-add-tool',
    label: 'Open Add Tool menu',
    keys: 'mod+t',
    category: 'tabs',
    action: () => setShowDropdown(true),
  });

  /**
   * Run Dev Server — Play button handler (also triggered by Ctrl+Shift+D hotkey).
   *
   * Behavior depends on whether a run script was resolved:
   *
   * 1. If resolved: runs the resolved command in a terminal panel.
   *    Resolution is done by `projects:resolve-run-script` IPC (see project.ts)
   *    which checks, in order:
   *      - DB run_script (Project Settings)
   *      - pane.json scripts.run
   *      - conductor.json scripts.run
   *      - .gitpod.yml first task command
   *      - devcontainer.json postStartCommand
   *      - scripts/pane-run-script.js in the worktree
   *
   * 2. If nothing resolved: launches Claude to auto-generate a run script
   *    tailored to the project's framework (the "Setup Run Script" flow).
   *
   * The tooltip shows which command will run and its source (e.g. "from pane.json").
   */
  const handleRunDevServer = useCallback(async () => {
    if (!session) return;
    if (resolvedRunScript) {
      handleAddPanel('terminal', {
        initialCommand: resolvedRunScript.command,
        title: 'Dev Server'
      });
    } else {
      // No run script resolved — let Claude set one up
      handleAddPanel('terminal', {
        initialCommand: `claude --dangerously-skip-permissions "${buildSetupRunScriptPrompt(config?.worktreeFileSync).replace(/\n/g, ' ')}"`,
        title: 'Setup Run Script'
      });
    }
  }, [session, handleAddPanel, resolvedRunScript, config?.worktreeFileSync]);

  // Ctrl+Shift+D: Run Dev Server
  useHotkey({
    id: 'run-dev-server',
    label: 'Run Dev Server',
    keys: 'mod+shift+d',
    category: 'tools',
    action: handleRunDevServer,
    enabled: () => !!session,
  });

  // Get available panel types (excluding permanent panels, logs, and enforcing singleton)
  const availablePanelTypes = (Object.keys(PANEL_CAPABILITIES) as ToolPanelType[])
    .filter(type => {
      const capabilities = PANEL_CAPABILITIES[type];

      // Filter based on context
      if (context === 'project' && !capabilities.canAppearInProjects) return false;
      if (context === 'worktree' && !capabilities.canAppearInWorktrees) return false;

      // Exclude permanent panels
      if (capabilities.permanent) return false;

      // Exclude logs panel - it's only created automatically when running scripts
      if (type === 'logs') return false;

      // Enforce singleton panels
      if (capabilities.singleton) {
        // Check if a panel of this type already exists
        return !panels.some(p => p.type === type);
      }

      return true;
    });
  
  const getPanelIcon = (type: ToolPanelType, panel?: ToolPanel) => {
    // Check for brand-specific terminal panels by title
    if (type === 'terminal' && panel) {
      const title = panel.title.toLowerCase();
      for (const [keyword, IconComponent] of Object.entries(CLI_BRAND_ICONS)) {
        if (title.includes(keyword)) {
          return <IconComponent className="w-4 h-4" />;
        }
      }
    }
    switch (type) {
      case 'terminal':
        return <Terminal className="w-4 h-4" />;
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
  };

  // Whether a tab drag is hovering the bar (drives the un-split affordance)
  const [dragOverBar, setDragOverBar] = useState(false);
  useEffect(() => {
    if (!isTabDragging) setDragOverBar(false);
  }, [isTabDragging]);

  // Sort panels: explorer first, diff second, then by position
  const sortedPanels = useMemo(() => {
    const typeOrder = (type: string) => {
      if (type === 'explorer') return 0;
      if (type === 'diff') return 1;
      if (type === 'browser') return 2;
      return 3;
    };
    return [...panels].sort((a, b) => {
      const orderDiff = typeOrder(a.type) - typeOrder(b.type);
      if (orderDiff !== 0) return orderDiff;
      return (a.metadata?.position ?? 0) - (b.metadata?.position ?? 0);
    });
  }, [panels]);

  return (
    <>
    <div className="panel-tab-bar bg-bg-chrome flex-shrink-0">
      {/* Flex container */}
      <div
        className="relative flex items-center min-h-[var(--panel-tab-height)] px-2"
        role="tablist"
        aria-label="Panel Tabs"
        onDragOver={tabsInGroups && isTabDragging ? () => setDragOverBar(true) : undefined}
        onDragLeave={tabsInGroups && isTabDragging ? () => setDragOverBar(false) : undefined}
      >
        {/* Un-split affordance: dropping a tab on the top bar while split
            merges every group back into the primary group. Advertise that
            while a drag hovers the bar (pointer-events-none so drops pass
            through to the strip). */}
        {tabsInGroups && isTabDragging && dragOverBar && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-surface-primary border border-[color-mix(in_srgb,var(--color-interactive-primary)_40%,transparent)] text-text-secondary shadow-dropdown">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                <line x1="8" y1="2.5" x2="8" y2="13.5" strokeDasharray="2 2" opacity="0.5" />
                <path d="M5.5 8h5M9 6.5 10.5 8 9 9.5" />
              </svg>
              Drop to merge all tabs back here
            </span>
          </div>
        )}
        {/* Scrollable tab area — delegated to PanelTabStrip. When the pane is
            split, SessionView passes only the primary group's permanent tabs
            here (working tabs live in the group strips); shortcut hints are
            disabled then because the strip shows a subset and the 1-9 indexes
            would lie. */}
        <PanelTabStrip
          panels={primaryGroupPanels ?? sortedPanels}
          activePanelId={primaryGroupActivePanelId !== undefined ? primaryGroupActivePanelId : (activePanel?.id ?? null)}
          onPanelSelect={handlePanelClick}
          onPanelClose={handlePanelClose}
          isPrimary
          isFocused={primaryGroupFocused ?? true}
          showShortcutHints={!tabsInGroups}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onStripDrop={onStripDrop}
          isTabDragging={isTabDragging}
          draggedPanelId={draggedPanelId}
          getPanelTabPresentation={getPanelTabPresentation}
        />

        {/* Add Panel dropdown button - outside overflow container so dropdown isn't clipped */}
        <div className="relative h-[var(--panel-tab-height)] flex items-center flex-shrink-0" ref={dropdownRef}>
          <Tooltip content={hotkeyDisplay('open-add-tool') ? <Kbd>{hotkeyDisplay('open-add-tool')}</Kbd> : undefined} side="bottom">
            <button
              className="inline-flex items-center h-[var(--panel-tab-height)] px-3 text-sm text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-subtle"
              onClick={() => setShowDropdown(!showDropdown)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' && !showDropdown) {
                  e.preventDefault();
                  setShowDropdown(true);
                }
              }}
              aria-haspopup="menu"
              aria-expanded={showDropdown}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tool
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </Tooltip>

          {showDropdown && (() => {
            // Track ref index for keyboard navigation
            let refIndex = 0;
            const menuItemClass = "flex items-start w-full px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus:bg-surface-hover focus:text-text-primary focus:outline-none text-left";

            return createPortal(
            <div
              ref={dropdownMenuRef}
              className="bg-surface-primary border border-border-primary rounded shadow-dropdown z-50 animate-dropdown-enter"
              style={dropdownStyle}
              role="menu"
              onKeyDown={handleDropdownKeyDown}
            >
              {/* Terminal - plain terminal */}
              {availablePanelTypes.includes('terminal') && (
                <button
                  ref={(el) => { dropdownItemsRef.current[refIndex++] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel('terminal')}
                >
                  <Terminal className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 flex-1 min-w-0">
                    <span className="block">Terminal</span>
                    {hotkeyDisplay('add-tool-terminal') && <Kbd size="xs" variant="muted" className="mt-1 origin-left scale-[0.7]">{hotkeyDisplay('add-tool-terminal')}</Kbd>}
                  </span>
                </button>
              )}
              {/* Explorer */}
              {availablePanelTypes.includes('explorer') && (
                <button
                  ref={(el) => { dropdownItemsRef.current[refIndex++] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel('explorer')}
                >
                  <FolderTree className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 flex-1 min-w-0">
                    <span className="block">Explorer</span>
                    {hotkeyDisplay('add-tool-explorer') && <Kbd size="xs" variant="muted" className="mt-1 origin-left scale-[0.7]">{hotkeyDisplay('add-tool-explorer')}</Kbd>}
                  </span>
                </button>
              )}
              {/* Claude Code */}
              {availablePanelTypes.includes('terminal') && (
                <button
                  ref={(el) => { dropdownItemsRef.current[refIndex++] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel('terminal', {
                    initialCommand: 'claude --dangerously-skip-permissions',
                    title: 'Claude Code'
                  })}
                >
                  <ClaudeIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 flex-1 min-w-0">
                    <span className="block">Claude Code</span>
                    {hotkeyDisplay('add-tool-terminal-claude') && <Kbd size="xs" variant="muted" className="mt-1 origin-left scale-[0.7]">{hotkeyDisplay('add-tool-terminal-claude')}</Kbd>}
                  </span>
                </button>
              )}
              {/* Codex */}
              {availablePanelTypes.includes('terminal') && (
                <button
                  ref={(el) => { dropdownItemsRef.current[refIndex++] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel('terminal', {
                    initialCommand: 'codex --yolo',
                    title: 'Codex'
                  })}
                >
                  <OpenAIIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 flex-1 min-w-0">
                    <span className="block">Codex</span>
                    {hotkeyDisplay('add-tool-terminal-codex') && <Kbd size="xs" variant="muted" className="mt-1 origin-left scale-[0.7]">{hotkeyDisplay('add-tool-terminal-codex')}</Kbd>}
                  </span>
                </button>
              )}
              {/* Saved custom commands */}
              {availablePanelTypes.includes('terminal') && customCommands.map((cmd, index) => {
                const currentRefIndex = refIndex++;
                const shortcutDisplay = hotkeyDisplay(`add-tool-custom-${index}`);
                return (
                <button
                  key={`custom-${index}`}
                  ref={(el) => { dropdownItemsRef.current[currentRefIndex] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel('terminal', {
                    initialCommand: cmd.command,
                    title: cmd.name
                  })}
                  onKeyDown={(e) => {
                    // Delete or Backspace removes the custom command
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteCustomCommand(index);
                    }
                  }}
                  title={`${cmd.name} (Delete/Backspace to remove)`}
                >
                  {getCliBrandIcon(cmd.command, 'w-4 h-4 flex-shrink-0 mt-0.5') || <TerminalSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span className="ml-2 flex-1 min-w-0">
                    <span className="block truncate">{cmd.name}</span>
                    {shortcutDisplay && <Kbd size="xs" variant="muted" className="mt-1 origin-left scale-[0.7]">{shortcutDisplay}</Kbd>}
                  </span>
                  <button
                    className="p-0.5 ml-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomCommand(index);
                    }}
                    title="Remove shortcut"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              );})}
              {/* Add Custom Command input */}
              {availablePanelTypes.includes('terminal') && (
                showCustomInput ? (
                  <div className="px-3 py-2 border-b border-border-primary">
                    <label className="text-xs text-text-tertiary mb-1 block">Command to run:</label>
                    <input
                      ref={(el) => { customInputRef.current = el; dropdownItemsRef.current[refIndex++] = el; }}
                      type="text"
                      className="w-full px-2 py-1.5 text-sm bg-surface-secondary border border-border-primary rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
                      placeholder="e.g. aider, npm run dev, bash"
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customCommand.trim()) {
                          const command = customCommand.trim();
                          const name = command.split(/\s+/).slice(0, 3).join(' ');
                          saveCustomCommand(name, command);
                          handleAddPanel('terminal', {
                            initialCommand: command,
                            title: name
                          });
                          setCustomCommand('');
                          setShowCustomInput(false);
                        }
                        if (e.key === 'Escape') {
                          setShowCustomInput(false);
                          setCustomCommand('');
                        }
                        // Let arrow keys propagate for dropdown navigation
                      }}
                    />
                  </div>
                ) : (
                  <button
                    ref={(el) => { dropdownItemsRef.current[refIndex++] = el; }}
                    role="menuitem"
                    className={`${menuItemClass} border-b border-border-primary`}
                    onClick={() => setShowCustomInput(true)}
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="ml-2">Add Custom Command...</span>
                  </button>
                )
              )}
              {/* Other panel types (excluding terminal and explorer, already listed above) */}
              {availablePanelTypes.filter(t => t !== 'terminal' && t !== 'explorer').map((type) => {
                const currentRefIndex = refIndex++;
                return (
                <button
                  key={type}
                  ref={(el) => { dropdownItemsRef.current[currentRefIndex] = el; }}
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => handleAddPanel(type)}
                >
                  {getPanelIcon(type)}
                  <span className="ml-2 capitalize">{type}</span>
                </button>
              );})}
            </div>,
            document.body
            );
          })()}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {/* Resource monitor chip */}
          <button
            ref={resourceChipRef}
            onClick={toggleResourcePopover}
            className={cn(
              "inline-flex items-center gap-1.5 h-[var(--panel-tab-height)] px-2.5 rounded text-xs font-mono transition-colors flex-shrink-0",
              showResourcePopover
                ? "text-text-primary bg-surface-hover"
                : "text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Resource Usage"
          >
            <Cpu className="w-3.5 h-3.5" />
            {snapshot && (
              <>
                {snapshot.cpuReady && (
                  <>
                    <span>{snapshot.totalCpuPercent.toFixed(0)}%</span>
                    <span className="text-text-quaternary">|</span>
                  </>
                )}
                <span>{formatMemory(snapshot.totalMemoryMB)}</span>
              </>
            )}
          </button>

          {/* Run Dev Server button */}
          {session && (
            <Tooltip content={
                <span className="flex flex-col items-start gap-1">
                  <span className="text-text-secondary">
                    {resolvedRunScript
                      ? `Run: ${resolvedRunScript.command}`
                      : 'Set up run script (via Claude)'}
                  </span>
                  {resolvedRunScript && (
                    <span className="text-text-tertiary text-[10px]">from {resolvedRunScript.source}</span>
                  )}
                  {hotkeyDisplay('run-dev-server') && <Kbd size="xs" variant="muted" className="origin-left scale-[0.8]">{hotkeyDisplay('run-dev-server')}</Kbd>}
                </span>
              } side="bottom">
              <button
                className="inline-flex items-center justify-center h-[var(--panel-tab-height)] px-2.5 rounded text-text-tertiary hover:text-status-success hover:bg-surface-hover transition-colors flex-shrink-0"
                onClick={handleRunDevServer}
              >
                <Play className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Detail panel toggle */}
          {onToggleDetailPanel && (
            <Tooltip content={hotkeyDisplay('toggle-detail-panel') ? <Kbd>{hotkeyDisplay('toggle-detail-panel')}</Kbd> : undefined} side="bottom">
              <button
                onClick={onToggleDetailPanel}
                className={cn(
                  "inline-flex items-center justify-center h-[var(--panel-tab-height)] px-2.5 rounded transition-colors flex-shrink-0",
                  detailPanelVisible
                    ? "text-text-primary bg-surface-hover"
                    : "text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
                )}
                title={detailPanelVisible ? "Hide detail panel" : "Show detail panel"}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>

    {/* Resource monitor popover */}
    {showResourcePopover && createPortal(
      <div
        ref={resourcePopoverRef}
        className="bg-surface-primary border border-border-subtle/60 rounded-lg shadow-dropdown-elevated backdrop-blur-sm animate-dropdown-enter overflow-hidden w-[320px]"
        style={popoverStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-secondary">
          <span className="text-[10px] font-semibold text-text-tertiary tracking-wider uppercase">
            Resource Usage
          </span>
          <button
            onClick={handleRefresh}
            className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            disabled={resourceLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", resourceLoading && "animate-spin")} />
          </button>
        </div>

        {!snapshot ? (
          <div className="px-3 py-4 text-sm text-text-secondary">
            {resourceLoading ? 'Loading resource usage...' : 'No resource snapshot yet.'}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-4 px-3 py-2 border-b border-border-secondary">
              <span className="text-sm text-text-secondary">
                CPU <strong className="text-text-primary">{snapshot.cpuReady ? `${snapshot.totalCpuPercent.toFixed(1)}%` : '—'}</strong>
              </span>
              <span className="text-sm text-text-secondary">
                Memory <strong className="text-text-primary">{formatMemory(snapshot.totalMemoryMB)}</strong>
              </span>
            </div>

            {/* Scrollable content */}
            <div className="max-h-[400px] overflow-y-auto">
              {/* Pane App section */}
              <div className="border-b border-border-secondary">
                <button
                  onClick={() => toggleSection('pane-app')}
                  className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {expandedSections.has('pane-app')
                      ? <ChevronDown className="w-3 h-3 text-text-quaternary" />
                      : <ChevronRight className="w-3 h-3 text-text-quaternary" />}
                    <span className="text-sm font-medium text-text-primary">Pane App</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono">
                    <span>{snapshot.cpuReady ? `${electronTotalCpu.toFixed(1)}%` : '—'}</span>
                    <span>{formatMemory(electronTotalMem)}</span>
                  </div>
                </button>
                {expandedSections.has('pane-app') && snapshot.electronProcesses.map(p => (
                  <div key={p.pid} className="flex items-center justify-between px-3 py-1 pl-8">
                    <span className="text-xs text-text-secondary">{p.label}</span>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono">
                      <span>{snapshot.cpuReady ? `${p.cpuPercent.toFixed(1)}%` : '—'}</span>
                      <span>{formatMemory(p.memoryMB)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-session sections */}
              {snapshot.sessions.map(sess => (
                <div
                  key={sess.sessionId}
                  className={cn(
                    "border-b border-border-secondary",
                    sess.sessionId === session?.id && "bg-interactive/5"
                  )}
                >
                  <button
                    onClick={() => toggleSection(sess.sessionId)}
                    className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {expandedSections.has(sess.sessionId)
                        ? <ChevronDown className="w-3 h-3 text-text-quaternary flex-shrink-0" />
                        : <ChevronRight className="w-3 h-3 text-text-quaternary flex-shrink-0" />}
                      {sess.sessionId === session?.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-interactive flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-text-primary truncate">{sess.sessionName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono flex-shrink-0 ml-2">
                      <span>{snapshot.cpuReady ? `${sess.totalCpuPercent.toFixed(1)}%` : '—'}</span>
                      <span>{formatMemory(sess.totalMemoryMB)}</span>
                    </div>
                  </button>
                  {expandedSections.has(sess.sessionId) && sess.children.map(child => (
                    <div key={child.pid} className="flex items-center justify-between px-3 py-1 pl-8">
                      <span className="text-xs text-text-secondary truncate">{child.name}</span>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono flex-shrink-0 ml-2">
                        <span>{snapshot.cpuReady ? `${child.cpuPercent.toFixed(1)}%` : '—'}</span>
                        <span>{formatMemory(child.memoryMB)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>,
      document.body
    )}
    </>
  );
});

PanelTabBar.displayName = 'PanelTabBar';
