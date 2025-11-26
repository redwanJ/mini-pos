'use client';

import { AlertCircle, Check, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertMessageProps {
  type: AlertType;
  message: string;
  className?: string;
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    className: 'text-red-500',
    bgClassName: 'bg-red-50 dark:bg-red-900/20',
  },
  success: {
    icon: Check,
    className: 'text-green-500',
    bgClassName: 'bg-green-50 dark:bg-green-900/20',
  },
  info: {
    icon: Info,
    className: 'text-blue-500',
    bgClassName: 'bg-blue-50 dark:bg-blue-900/20',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-500',
    bgClassName: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
};

export function AlertMessage({ type, message, className = '' }: AlertMessageProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${config.className} text-sm ${className}`}>
      <Icon className="w-4 h-4" />
      {message}
    </div>
  );
}

export function AlertBox({ type, message, className = '' }: AlertMessageProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgClassName} rounded-xl p-4 ${className}`}>
      <div className={`flex items-center gap-3 ${config.className}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
}
