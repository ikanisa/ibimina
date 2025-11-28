import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Switch({ id, checked, onChange, disabled, label, className }: SwitchProps) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      {label && <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}
