import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - darker, industrial */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content - sharp industrial styling */}
      <div className={`
        relative
        ${sizeClasses[size]}
        w-full
        mx-4
        bg-slate-900
        border-2 border-slate-700
        rounded-sm
      `}>
        {/* Header - industrial panel look */}
        <div className="
          flex items-center justify-between
          px-5 py-4
          bg-slate-950
          border-b-2 border-slate-700
        ">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
            <h2 className="font-mono text-blue-400 text-lg uppercase tracking-widest font-bold">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="
              p-1.5
              text-slate-500 hover:text-red-400
              hover:bg-red-500/10
              rounded-sm
              transition-colors
              border border-transparent
              hover:border-red-500/30
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
