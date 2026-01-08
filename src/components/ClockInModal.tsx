import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTimeClock, useAuth } from '../state';

const DISMISS_KEY = 'clockInModalDismissed';
const DISMISS_HOURS = 8;

export function ClockInModal() {
  const { user } = useAuth();
  const { isClockedIn, clockIn } = useTimeClock();
  const [isOpen, setIsOpen] = useState(false);
  const [dontAskToday, setDontAskToday] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    if (!user || isClockedIn) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      const hoursSinceDismiss = (now - dismissTime) / (1000 * 60 * 60);

      if (hoursSinceDismiss < DISMISS_HOURS) {
        return; // Don't show if dismissed within 8 hours
      }
    }

    // Show modal after a short delay to let the app render
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, isClockedIn]);

  const handleClockIn = () => {
    clockIn();
    setIsOpen(false);
  };

  const handleDismiss = () => {
    if (dontAskToday) {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title=""
      size="sm"
    >
      <div className="text-center py-4">
        {/* Industrial icon container */}
        <div className="w-16 h-16 bg-blue-500/10 border-2 border-blue-500/30 rounded-sm flex items-center justify-center mx-auto mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator absolute top-2 right-2" />
          <Clock size={32} className="text-blue-400" />
        </div>

        <h2 className="text-xl font-mono text-slate-100 mb-2 font-bold tracking-wide">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>

        <p className="text-slate-400 font-mono text-sm mb-6">
          Would you like to clock in?
        </p>

        <div className="flex gap-3 mb-4">
          <Button
            variant="primary"
            onClick={handleClockIn}
            className="flex-1"
          >
            Yes, Clock In
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1"
          >
            Not Now
          </Button>
        </div>

        <label className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono cursor-pointer uppercase tracking-wider">
          <input
            type="checkbox"
            checked={dontAskToday}
            onChange={(e) => setDontAskToday(e.target.checked)}
            className="w-4 h-4 rounded-sm border-2 border-slate-600 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
          />
          Don't ask again today
        </label>
      </div>
    </Modal>
  );
}
