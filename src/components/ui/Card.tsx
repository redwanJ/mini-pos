'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export function Card({ children, className = '', animate = true, delay = 0 }: CardProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`card p-4 ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={`card p-4 ${className}`}>{children}</div>;
}

interface CardHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  action?: ReactNode;
}

export function CardHeader({ icon: Icon, iconColor = 'text-blue-600', title, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}

interface ClickableCardProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export function ClickableCard({ children, onClick, className = '' }: ClickableCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full card card-hover p-4 text-left ${className}`}
    >
      {children}
    </button>
  );
}
