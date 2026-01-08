import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-600 hover:bg-blue-500
    text-white font-bold
    border-2 border-blue-500
    active:bg-blue-700
  `,
  secondary: `
    bg-slate-800 hover:bg-slate-700
    text-blue-400
    border-2 border-slate-600
    hover:border-blue-500/50
  `,
  ghost: `
    bg-transparent hover:bg-slate-800
    text-slate-400 hover:text-blue-400
    border-2 border-transparent
    hover:border-slate-700
  `,
  danger: `
    bg-red-600/20 hover:bg-red-600/30
    text-red-400
    border-2 border-red-500/50
    hover:border-red-500
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-mono uppercase tracking-widest
        rounded-sm
        transition-all
        flex items-center justify-center gap-2
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-opacity-100
        ${className}
      `}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
}
