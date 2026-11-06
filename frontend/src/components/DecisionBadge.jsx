import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function DecisionBadge({ recommendation, size = 'md' }) {
  const norm = (recommendation || '').toUpperCase();

  const configs = {
    'BUY NOW': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      label: 'BUY NOW',
      dot: 'bg-emerald-500',
    },
    WAIT: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: Clock,
      label: 'WAIT',
      dot: 'bg-amber-500',
    },
    RECONSIDER: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertTriangle,
      label: 'RECONSIDER',
      dot: 'bg-rose-500',
    },
  };

  const current = configs[norm] || configs['RECONSIDER'];
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    md: 'px-3.5 py-1.5 text-sm font-semibold gap-2',
    lg: 'px-5 py-2.5 text-base font-bold gap-2.5 tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${current.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse`} />
      <Icon className={size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {current.label}
    </span>
  );
}

