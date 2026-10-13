import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'No records found',
  description = 'No items match your active filters. Try resetting your search or load preset data.',
  actionLabel = 'Reset Filters',
  onAction,
  actionIcon: ActionIcon
}) {
  return (
    <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-white/[0.08] rounded-3xl bg-gray-50/50 dark:bg-white/[0.02]">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3.5">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {onAction && actionLabel && (
        <div className="mt-5">
          <Button
            size="sm"
            variant="secondary"
            onClick={onAction}
            icon={ActionIcon}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
