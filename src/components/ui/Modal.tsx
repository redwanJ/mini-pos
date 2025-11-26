'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'bottom-sheet' | 'center' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'bottom-sheet',
}: ModalProps) {
  const getModalClasses = () => {
    switch (variant) {
      case 'center':
        return 'bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4';
      case 'full':
        return 'bg-white dark:bg-gray-800 w-full h-full';
      default:
        return 'bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90dvh] modal-container';
    }
  };

  const getAnimation = () => {
    switch (variant) {
      case 'center':
        return {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.9, opacity: 0 },
        };
      case 'full':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      default:
        return {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
        };
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'center':
        return 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      case 'full':
        return 'fixed inset-0 bg-black/90 z-50 flex flex-col';
      default:
        return 'fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={getContainerClasses()}
          onClick={onClose}
        >
          <motion.div
            {...getAnimation()}
            onClick={(e) => e.stopPropagation()}
            className={getModalClasses()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 sm:pt-4 min-h-0">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 safe-bottom">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function CenterModal({ isOpen, onClose, children }: CenterModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
