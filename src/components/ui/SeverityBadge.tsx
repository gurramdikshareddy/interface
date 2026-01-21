import React from 'react';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { SeverityChange } from '@/types/hospital';

interface SeverityBadgeProps {
  change: SeverityChange;
  score?: number;
}

export function SeverityBadge({ change, score }: SeverityBadgeProps) {
  const configs = {
    increased: {
      className: 'severity-increased',
      icon: TrendingUp,
      text: 'Severity Increased',
    },
    improved: {
      className: 'severity-improved',
      icon: TrendingDown,
      text: 'Severity Improved',
    },
    unchanged: {
      className: 'severity-unchanged',
      icon: Minus,
      text: 'No Change',
    },
    'first-visit': {
      className: 'bg-accent/10 text-accent inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      icon: Star,
      text: 'First Visit',
    },
  };

  const config = configs[change];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {score !== undefined && (
        <span className="text-sm font-medium text-foreground">{score}/5</span>
      )}
      <span className={config.className}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    </div>
  );
}
