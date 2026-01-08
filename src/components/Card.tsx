import { LucideIcon } from 'lucide-react';

type CardVariant = 'default' | 'highlight' | 'warning' | 'danger';

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-slate-700',
  highlight: 'border-blue-500',
  warning: 'border-amber-500',
  danger: 'border-red-500',
};

export function Card({
  title,
  icon: Icon,
  headerAction,
  children,
  variant = 'default',
  className = '',
}: CardProps) {
  return (
    <div className={`
      bg-slate-900
      border-2 ${variantStyles[variant]}
      rounded-sm
      overflow-hidden
      ${className}
    `}>
      {title && (
        <div className="
          bg-slate-950
          border-b-2 border-slate-700
          px-4 py-3
          flex items-center justify-between
        ">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
            )}
            {Icon && <Icon size={16} className="text-blue-400" />}
            <h3 className="font-mono text-blue-400 text-sm uppercase tracking-widest font-semibold">
              {title}
            </h3>
          </div>
          {headerAction}
        </div>
      )}

      <div className="p-4 lg:p-5">
        {children}
      </div>
    </div>
  );
}

// Stat Card for Dashboard - Industrial style
interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  color?: 'blue' | 'amber' | 'red' | 'cyan' | 'violet' | 'emerald';
}

const colorStyles: Record<string, { icon: string; border: string; led: string }> = {
  blue: {
    icon: 'text-blue-400 bg-blue-500/10',
    border: 'border-blue-500/50',
    led: 'bg-blue-500',
  },
  emerald: {
    icon: 'text-emerald-400 bg-emerald-500/10',
    border: 'border-emerald-500/50',
    led: 'bg-emerald-500',
  },
  amber: {
    icon: 'text-amber-400 bg-amber-500/10',
    border: 'border-amber-500/50',
    led: 'bg-amber-500',
  },
  red: {
    icon: 'text-red-400 bg-red-500/10',
    border: 'border-red-500/50',
    led: 'bg-red-500',
  },
  cyan: {
    icon: 'text-cyan-400 bg-cyan-500/10',
    border: 'border-cyan-500/50',
    led: 'bg-cyan-500',
  },
  violet: {
    icon: 'text-violet-400 bg-violet-500/10',
    border: 'border-violet-500/50',
    led: 'bg-violet-500',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue'
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={`
      bg-slate-900
      border-2 border-slate-700
      rounded-sm
      p-5
      hover:border-blue-500/50
      transition-all
      industrial-hover
    `}>
      {/* Top row: LED + Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${styles.led} led-indicator`} />
          <div className={`p-2 rounded-sm ${styles.icon}`}>
            <Icon size={20} />
          </div>
        </div>
        {trend !== undefined && (
          <span className={`
            text-xs font-mono font-bold
            px-2 py-0.5
            rounded-sm
            ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
          `}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {/* Value - large and prominent */}
      <div className="text-3xl font-mono text-white font-bold mb-1 tabular-nums">
        {value}
      </div>

      {/* Label */}
      <div className="text-xs text-slate-500 font-mono uppercase tracking-widest font-semibold">
        {label}
      </div>
    </div>
  );
}
