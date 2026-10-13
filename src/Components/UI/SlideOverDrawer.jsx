import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg'
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 w-full ${width} bg-white dark:bg-[#0B0F19] border-l border-gray-200 dark:border-white/[0.08] shadow-2xl flex flex-col z-10`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between bg-gray-50/50 dark:bg-[#111827]/50 backdrop-blur-md">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#111827]/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
