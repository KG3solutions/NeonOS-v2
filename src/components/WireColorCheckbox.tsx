import { Check } from 'lucide-react';
import { WireColor } from '../types';

interface WireColorCheckboxProps {
  color: WireColor;
  checked: boolean;
  onChange: () => void;
}

export function WireColorCheckbox({
  color,
  checked,
  onChange
}: WireColorCheckboxProps) {
  return (
    <button
      onClick={onChange}
      type="button"
      className={`
        flex items-center gap-2
        p-3
        rounded-lg
        border
        transition-all
        ${checked
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }
      `}
    >
      {/* Color swatch */}
      <div
        className="w-5 h-5 rounded-full border border-slate-600 flex-shrink-0"
        style={{ backgroundColor: color.hex }}
      />

      {/* Label */}
      <span className={`
        text-sm font-mono flex-1 text-left
        ${checked ? 'text-emerald-400' : 'text-slate-400'}
      `}>
        {color.name}
      </span>

      {/* Checkmark */}
      {checked && (
        <Check size={14} className="text-emerald-400 flex-shrink-0" />
      )}
    </button>
  );
}

// Wire Color Grid - for displaying multiple checkboxes
interface WireColorGridProps {
  colors: WireColor[];
  selectedColors: string[];
  onToggle: (colorName: string) => void;
}

export function WireColorGrid({
  colors,
  selectedColors,
  onToggle
}: WireColorGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {colors.map(color => (
        <WireColorCheckbox
          key={color.name}
          color={color}
          checked={selectedColors.includes(color.name)}
          onChange={() => onToggle(color.name)}
        />
      ))}
    </div>
  );
}
