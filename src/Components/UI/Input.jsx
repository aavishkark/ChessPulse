import React from 'react';
import { X } from 'lucide-react';

export default function Input({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  type = 'text',
  icon: Icon,
  mono = false,
  className = '',
  wrapperClassName = '',
  disabled = false,
  ...props
}) {
  return (
    <div className={`relative flex items-center ${wrapperClassName}`}>
      {Icon && (
        <div className="absolute left-3.5 text-gray-400 dark:text-gray-500 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/75 dark:bg-[#111827] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm py-2 px-3.5 ${
          Icon ? 'pl-10' : ''
        } ${onClear && value ? 'pr-9' : ''} ${
          mono ? 'font-mono text-xs' : ''
        } focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-400 transition-all ${className}`}
        {...props}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/[0.06] transition-colors"
          title="Clear"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
