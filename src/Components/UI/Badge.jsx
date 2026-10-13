import React from 'react';

export default function Badge({
  children,
  variant = 'violet',
  pulse = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const variantStyles = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    slate: 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/[0.08]'
  }[variant] || 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${variantStyles} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
      {...props}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-ping" />
      )}
      {Icon && <Icon className="w-3 h-3 text-current" />}
      <span>{children}</span>
    </span>
  );
}
