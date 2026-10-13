import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:pointer-events-none';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-medium',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  }[size] || 'px-4 py-2 text-sm gap-2';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-500/25 border border-violet-500/30',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/[0.08]',
    outline: 'bg-transparent hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 dark:border-violet-500/40',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-700 dark:text-gray-300',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono',
    amber: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-mono'
  }[variant] || '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className={size === 'xs' ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
      ) : null}

      <span>{children}</span>

      {!loading && IconRight && (
        <IconRight className={size === 'xs' ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
      )}
    </button>
  );
}
