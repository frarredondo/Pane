import React from 'react';
import { cn } from '../../utils/cn';
import { usePanelStore } from '../../stores/panelStore';
import { usePanelAgentDisplayStatus } from '../../hooks/useAgentStatus';
import { AgentStatusDot } from '../ui/AgentStatusDot';

interface PanelTabStatusDotProps {
  panelId: string;
  sessionId: string;
}

/**
 * Per-tab status dot: the agent status (blocked / working / done / idle) for
 * AI/CLI panels, falling back to the legacy active/idle activity dot for plain
 * terminal panels.
 */
export const PanelTabStatusDot: React.FC<PanelTabStatusDotProps> = ({ panelId, sessionId }) => {
  const displayStatus = usePanelAgentDisplayStatus(panelId, sessionId);
  const isActive = usePanelStore((s) => s.activityStatus[panelId] === 'active');

  if (displayStatus === 'unknown') {
    return (
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all',
          isActive ? 'bg-status-info opacity-100 duration-150' : 'bg-text-muted/20 opacity-40 duration-[3s]',
        )}
      />
    );
  }

  return <AgentStatusDot status={displayStatus} size="sm" className="flex-shrink-0" />;
};
