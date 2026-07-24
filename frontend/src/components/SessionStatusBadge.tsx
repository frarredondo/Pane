import React from 'react';
import { usePanelStore } from '../stores/panelStore';
import { useSessionAgentDisplayStatus } from '../hooks/useAgentStatus';
import { AgentStatusDot } from './ui/AgentStatusDot';

interface SessionStatusBadgeProps {
  sessionId: string;
  size?: 'sm' | 'md';
}

/**
 * Session dot for the sidebar / session list. Shows the herd-of-agents status
 * (blocked / working / done / idle) when the session has AI/CLI panels; for
 * sessions with only plain shells it falls back to the legacy active/idle dot.
 */
export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({ sessionId, size = 'md' }) => {
  const displayStatus = useSessionAgentDisplayStatus(sessionId);
  const isActive = usePanelStore((s) => s.getSessionActivityStatus(sessionId) === 'active');

  if (displayStatus === 'unknown') {
    // No agent panels — preserve the original binary activity indicator.
    const color = isActive
      ? 'bg-status-warning opacity-100 duration-150'
      : 'bg-text-muted/20 opacity-40 duration-[3s]';
    return (
      <div className={`w-2.5 h-2.5 rounded-full transition-all ${color} ${isActive ? 'animate-pulse' : ''}`} />
    );
  }

  return <AgentStatusDot status={displayStatus} size={size} />;
};
