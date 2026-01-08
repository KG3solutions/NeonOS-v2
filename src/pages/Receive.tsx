import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Package, Trash2, CheckCircle, AlertCircle, Barcode } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Select } from '../components';
import { useInventory, useAuth } from '../state';
import { ReceivingSessionItem } from '../types';

interface ReceiveProps {
  onNavigate: (path: string) => void;
}

type ReceiveReason = 'received_shipment' | 'return' | 'found' | 'other';

const reasonOptions = [
  { value: 'received_shipment', label: 'Received Shipment' },
  { value: 'return', label: 'Rental Return' },
  { value: 'found', label: 'Found Item' },
  { value: 'other', label: 'Other' },
];

export function Receive({ onNavigate }: ReceiveProps) {
  const { items, findByBarcode, adjustQuantity } = useInventory();
  const { user } = useAuth();

  const [scanInput, setScanInput] = useState('');
  const [sessionItems, setSessionItems] = useState<ReceivingSessionItem[]>([]);
  const [defaultReason, setDefaultReason] = useState<ReceiveReason>('received_shipment');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the scan input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleScan = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const barcode = scanInput.trim();

      // Try to find item by barcode or SKU
      const foundItem = findByBarcode(barcode);

      if (foundItem) {
        // Check if item already in session
        const existingIndex = sessionItems.findIndex(s => s.itemId === foundItem.id);

        if (existingIndex >= 0) {
          // Increment quantity
          setSessionItems(prev => prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ));
          setFeedback({ type: 'success', message: `+1 ${foundItem.name} (total: ${sessionItems[existingIndex].quantity + 1})` });
        } else {
          // Add new item to session
          const newSessionItem: ReceivingSessionItem = {
            itemId: foundItem.id,
            sku: foundItem.sku,
            name: foundItem.name,
            quantity: 1,
            reason: defaultReason,
          };
          setSessionItems(prev => [...prev, newSessionItem]);
          setFeedback({ type: 'success', message: `Added: ${foundItem.name}` });
        }
      } else {
        setFeedback({ type: 'error', message: `Item not found: ${barcode}` });
      }

      setScanInput('');
      inputRef.current?.focus();
    }
  };

  const updateSessionItem = (index: number, changes: Partial<ReceivingSessionItem>) => {
    setSessionItems(prev => prev.map((item, idx) =>
      idx === index ? { ...item, ...changes } : item
    ));
  };

  const removeSessionItem = (index: number) => {
    setSessionItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCompleteReceiving = () => {
    if (sessionItems.length === 0) return;

    setIsCompleting(true);

    // Process each item in the session
    sessionItems.forEach(sessionItem => {
      adjustQuantity(
        sessionItem.itemId,
        sessionItem.quantity,
        sessionItem.reason,
        { notes: sessionItem.notes }
      );
    });

    // Clear session
    setSessionItems([]);
    setFeedback({ type: 'success', message: `Successfully received ${sessionItems.length} item types` });
    setIsCompleting(false);
  };

  const totalItemCount = sessionItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PageTemplate
      title="Receive Items"
      actions={
        <>
          <Button
            variant="ghost"
            onClick={() => onNavigate('/inventory')}
          >
            Back to Inventory
          </Button>
          <Button
            variant="primary"
            icon={CheckCircle}
            onClick={handleCompleteReceiving}
            disabled={sessionItems.length === 0 || isCompleting}
          >
            Complete ({totalItemCount} items)
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-4">
              {/* Feedback Banner */}
              {feedback && (
                <div className={`
                  flex items-center gap-3 p-3 rounded-lg font-mono text-sm
                  ${feedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }
                `}>
                  {feedback.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  {feedback.message}
                </div>
              )}

              {/* Scan Input */}
              <div className="relative">
                <Barcode size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="Scan barcode or enter SKU..."
                  className="
                    w-full
                    bg-slate-800/50
                    border border-slate-700
                    rounded-lg
                    pl-12 pr-4 py-4
                    font-mono text-xl text-slate-200
                    placeholder:text-slate-600
                    focus:outline-none focus:border-emerald-500/50
                    focus:ring-2 focus:ring-emerald-500/20
                    transition-colors
                  "
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-4">
                <Select
                  label="Default Reason"
                  value={defaultReason}
                  onChange={(value) => setDefaultReason(value as ReceiveReason)}
                  options={reasonOptions}
                  className="w-48"
                />
                <p className="text-slate-500 text-sm font-mono mt-6">
                  Press Enter after scanning to add items
                </p>
              </div>
            </div>
          </Card>

          {/* Session Items List */}
          <Card title={`Session Items (${sessionItems.length} types, ${totalItemCount} total)`}>
            {sessionItems.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-500 font-mono">
                  No items scanned yet
                </p>
                <p className="text-slate-600 text-sm font-mono mt-1">
                  Scan a barcode or enter a SKU to begin
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionItems.map((sessionItem, index) => {
                  const inventoryItem = items[sessionItem.itemId];
                  return (
                    <div
                      key={sessionItem.itemId}
                      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-slate-200">
                          {sessionItem.name}
                        </div>
                        <div className="text-slate-500 text-sm font-mono">
                          {sessionItem.sku}
                          {inventoryItem && (
                            <span className="ml-2">
                              (current: {inventoryItem.quantity})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateSessionItem(index, {
                            quantity: Math.max(1, sessionItem.quantity - 1)
                          })}
                          className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-mono"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono text-lg text-emerald-400">
                          {sessionItem.quantity}
                        </span>
                        <button
                          onClick={() => updateSessionItem(index, {
                            quantity: sessionItem.quantity + 1
                          })}
                          className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-mono"
                        >
                          +
                        </button>
                      </div>

                      <Select
                        value={sessionItem.reason}
                        onChange={(value) => updateSessionItem(index, {
                          reason: value as ReceiveReason
                        })}
                        options={reasonOptions}
                        className="w-40"
                      />

                      <button
                        onClick={() => removeSessionItem(index)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Session Summary */}
        <div className="space-y-6">
          <Card title="Session Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-400">Item Types</span>
                <span className="text-slate-200">{sessionItems.length}</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-400">Total Units</span>
                <span className="text-emerald-400 text-xl">{totalItemCount}</span>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-slate-500">Received by</span>
                  <span className="text-slate-400">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center font-mono text-sm mt-2">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-400">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Tips">
            <div className="space-y-3 text-sm font-mono text-slate-500">
              <p>
                <span className="text-emerald-400">Scan</span> a barcode to add items
              </p>
              <p>
                Scanning the same item again will <span className="text-amber-400">increment</span> the quantity
              </p>
              <p>
                Use <span className="text-slate-300">+/-</span> buttons to adjust quantities manually
              </p>
              <p>
                Click <span className="text-emerald-400">Complete</span> when finished to update inventory
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
