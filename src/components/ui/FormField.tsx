'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel';
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
}

export function InputField({
  label,
  error,
  className = '',
  ...props
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className={`input ${error ? 'border-red-500' : ''}`} {...props} />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  options,
  className = '',
  ...props
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <select className={`input ${error ? 'border-red-500' : ''}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

export function FormRow({ children, cols = 2 }: FormRowProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-4`}>
      {children}
    </div>
  );
}
