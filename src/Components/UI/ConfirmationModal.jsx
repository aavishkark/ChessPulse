import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 z-10 overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${
                variant === 'danger'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
                loading={loading}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
