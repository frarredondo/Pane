import React from 'react';
import { cn } from '../../utils/cn';
import type { AgentDisplayStatus } from '../../../../shared/types/agentStatus';
import { agentStatusVisual } from './agentStatusVisual';

interface AgentStatusDotProps {
  status: AgentDisplayStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

const spinnerSizeClasses = {
  sm: 'w-3 h-3 border-2',
  md: 'w-3.5 h-3.5 border-2',
};

/**
 * At-a-glance agent status indicator. Working renders as an amber spinner; blocked
 * (red), done (blue), and idle (green) render as a dot — the "dot + spinner"
 * variation. Renders nothing for `unknown` so non-agent panels show no badge.
 */
export const AgentStatusDot: React.FC<AgentStatusDotProps> = ({ status, size = 'md', className }) => {
  const visual = agentStatusVisual(status);
  if (!visual) return null;

  if (status === 'working') {
    // Amber ring spinner conveys active work more clearly than a pulsing dot.
    return (
      <span
        className={cn(
          'inline-block rounded-full border-status-warning/30 border-t-status-warning animate-spin',
          spinnerSizeClasses[size],
          className,
        )}
        role="status"
        aria-label="Agent working"
        title="working"
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full transition-all',
        sizeClasses[size],
        visual.colorClass,
        visual.animate && 'animate-pulse',
        className,
      )}
      role="status"
      aria-label={`Agent ${visual.label}`}
      title={visual.label}
    />
  );
};
