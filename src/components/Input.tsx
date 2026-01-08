import { LucideIcon } from 'lucide-react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  type?: string;
  disabled?: boolean;
  className?: string;
  min?: string | number;
  max?: string | number;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  type = 'text',
  disabled,
  className = '',
  min,
  max,
}: InputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          className={`
            w-full
            bg-slate-950
            border-2 ${error ? 'border-red-500' : 'border-slate-700'}
            rounded-sm
            px-4 py-2.5
            ${Icon ? 'pl-10' : ''}
            font-mono text-slate-200
            placeholder:text-slate-600
            focus:outline-none focus:border-blue-500
            transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs font-mono flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}

// Textarea variant
interface TextareaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  rows = 4,
  disabled,
  className = '',
}: TextareaProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full
          bg-slate-950
          border-2 ${error ? 'border-red-500' : 'border-slate-700'}
          rounded-sm
          px-4 py-2.5
          font-mono text-slate-200
          placeholder:text-slate-600
          focus:outline-none focus:border-blue-500
          transition-colors
          resize-none
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      />
      {error && (
        <p className="text-red-400 text-xs font-mono flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}

// Select variant
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  className = '',
}: SelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full
          bg-slate-950
          border-2 ${error ? 'border-red-500' : 'border-slate-700'}
          rounded-sm
          px-4 py-2.5
          font-mono text-slate-200
          focus:outline-none focus:border-blue-500
          transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed
          cursor-pointer
        `}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-400 text-xs font-mono flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}
