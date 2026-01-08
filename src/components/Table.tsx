import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 font-mono border-2 border-dashed border-slate-700 rounded-sm">
        <div className="w-3 h-3 rounded-full bg-slate-600 mx-auto mb-3" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-slate-700 rounded-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-950 border-b-2 border-slate-700">
            {columns.map(col => (
              <th
                key={col.key}
                className={`
                  text-left
                  py-3 px-4
                  text-blue-400
                  font-mono
                  text-xs
                  uppercase
                  tracking-widest
                  font-bold
                  ${col.className || ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500" />
                  {col.header}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-slate-800
                bg-slate-900
                hover:bg-slate-800
                transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-4 font-mono ${col.className || ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge Component - Industrial style
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const statusVariants = {
  default: 'bg-slate-800 text-slate-300 border-slate-600',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/50',
  error: 'bg-red-500/10 text-red-400 border-red-500/50',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
};

// LED colors for status
const statusLed = {
  default: 'bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

// Map common status strings to variants
const statusToVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  pending: 'warning',
  blocked: 'error',
  approved: 'success',
  denied: 'error',
  draft: 'default',
  reserved: 'info',
  overdue: 'error',
  returned: 'success',
  cancelled: 'default',
  paid: 'success',
  unpaid: 'warning',
  partial: 'warning',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusToVariant[status] || 'default';

  return (
    <span className={`
      inline-flex items-center gap-1.5
      px-2 py-1
      rounded-sm
      text-xs font-mono uppercase tracking-wider font-semibold
      border
      ${statusVariants[resolvedVariant]}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusLed[resolvedVariant]}`} />
      {status}
    </span>
  );
}
