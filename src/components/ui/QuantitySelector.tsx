'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    button: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-sm w-6',
  },
  md: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-base w-8',
  },
  lg: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-xl w-12',
  },
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Infinity,
  size = 'md',
}: QuantitySelectorProps) {
  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${classes.button} rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}
        disabled={value <= min}
      >
        <Minus className={classes.icon} />
      </button>
      <span className={`${classes.text} text-center font-medium`}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${classes.button} rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}
        disabled={value >= max}
      >
        <Plus className={classes.icon} />
      </button>
    </div>
  );
}
